var fs = require('fs');
var path = require('path');

var baseNesting = 0;

function getNode(match) {
    return {
        type: match[1] ? 'CLOSING' : match[4] ? 'AUTOCLOSING' : 'OPENING',
        tag: match[2],
        attr: match[3] || null,
        childs: [],
        indexs: {
            begin: match.index,
            end: match.index + match[0].length
        }
    }
}

function getVoidNode(node){
    return {
        type:'TEXT',
        content:node
    }
}

function createNode(tag,attrs,childs,nestingLevel){
    if(typeof tag == "object"){
        nestingLevel = attrs;
        attrs = tag.attr;
        childs = tag.childs;
        tag = tag.tag;
    }
    if(nestingLevel == void 0)
        nestingLevel = 0;
    tag = tag.charCodeAt(0) > 90 ? '"'+tag+'"' : tag;
    attrs = attrs != null ? ObjToString(attrs) : 'null';
    childs = childs != null && childs.length ? ArrayToString(childs,nestingLevel) : 'null';
    return 'A.createElement(' + tag + ', ' + attrs + ', ' + childs + ')';
}

function createVoidNode(node){
    if(typeof node == "string")
        return 'A.createVoidElement("'+node+'")';
    else
        return 'A.createVoidElement("'+node.content+'")';
}



function trimHTML(html){
    return html.replace(/\s*$/g,'').replace(/^\s*/g,'').replace(/\n\r\t/g,'').replace(/ +/g,' ').replace(/\"/g,'\\"').replace(/\'/,"\\'");
}

function ObjToString(obj){
    if(typeof obj != "object")
        return obj;

    if(!Object.keys(obj).length)
        return "{}";

    var ret = "";
    for(var k in obj){
        if(ret.length == 0)
            ret += "{"+k+": "+obj[k];
        else
            ret += ", "+k+": "+obj[k];
    }
    ret += "}";
    return ret;
}

function ArrayToString(arr,stackStair) {

    if(!Array.isArray(arr))
        return arr;

    if(!arr.length)
        return '[]';

    if(stackStair == void 0)
        stackStair = 0;

    var ret = '';
    for(var i = 0, l = arr.length; i<l; i++){
        if(ret.length == 0)
            ret += '[\n' + '    '.repeat(stackStair+1) + arr[i];
        else
            ret += ',\n' + '    '.repeat(stackStair+1) + arr[i];
    }
    ret += '\n' + '    '.repeat(stackStair) + ']';

    return ret;
}




function parser(html) {
    baseNesting = -1;

    var regex = {
            jsx:/\((\s*<\w+(?:.|\s)*\w+>\s*)\)/g,
            tag:/<(\/)?(\w+)\s?([^>\/]*)(\/)?>/g,
            attr:/(\w+)=(?:("[^"]+")|{([^}]+)})/g
        },
        match = {
            tag:[],
            attr:[],
        },
        cursor = {
            last:0,
            now:0
        },
        stack = [{childs:[]}], node, trimedHTML, nodes = [];



    while(match.tag = regex.tag.exec(html)){



        node = getNode(match.tag);

        cursor.now = node.indexs.begin;

        if(cursor.now > cursor.last){
            var substrHtml = html.substring(cursor.last, cursor.now);

            if(baseNesting == -1){
                if(substrHtml.indexOf('\n') != -1) {
                    var nest = substrHtml.substring(substrHtml.indexOf('\n'), substrHtml.length).split('\t').length - 1;
                    if (nest)
                        baseNesting = nest;
                    else {
                        nest = substrHtml.substring(substrHtml.indexOf('\n'), substrHtml.length).split('    ').length - 1;
                        if (nest)
                            baseNesting = nest;
                        else
                            baseNesting = 0;
                    }
                }
                else
                    baseNesting = 0;
            }

            trimedHTML = trimHTML(substrHtml);
            if(trimedHTML.length){
                stack[stack.length - 1].childs.push(getVoidNode(trimedHTML));
            }
        }

        if(node.type == 'OPENING'){
            if(node.attr){
                var attributs = node.attr;
                node.attr = {};
                while(match.attr = regex.attr.exec(attributs)){
                    node.attr[match.attr[1]] = match.attr[2] || match.attr[3];
                }
            }
            stack.push(node);
        }
        else if(node.type == 'CLOSING'){
            var openingNode = stack.pop(),
                closingNode = node;

            if(openingNode.tag != closingNode.tag)
                return;

            openingNode.type = 'NODE';

            openingNode.indexs.end = closingNode.indexs.end;

            stack[stack.length - 1].childs.push(openingNode);
        }
        else{
            node.type = 'NODE';
            if(node.attr){
                var attributs = node.attr;
                node.attr = {};
                while(match.attr = regex.attr.exec(attributs)){
                    node.attr[match.attr[1]] = match.attr[2] || match.attr[3];
                }
            }
            stack[stack.length - 1].childs.push(node);
        }

        cursor.last = node.indexs.end;
    }

    if(html.length > cursor.last){
        trimedHTML = trimHTML(html.substring(cursor.last, html.length));
        if(trimedHTML.length){
            stack[stack.length - 1].childs.push(getVoidNode(trimedHTML));
        }
    }

    if(baseNesting == -1)
        baseNesting = 0;

    return stack.pop().childs;

}

function nodeTreeToStringTree(nodeTree,nestingLevel){
    if(nestingLevel == void 0)
        nestingLevel = 0;
    var stringTree = [],
        node;

    for(var i = 0, l = nodeTree.length; i < l; i++){
        node = nodeTree[i];
        switch(node.type){
            case 'TEXT':
                stringTree.push(createVoidNode(node));
                break;
            case 'NODE':
                if(node.childs.length){
                    stringTree.push(createNode(node.tag,node.attr,nodeTreeToStringTree(node.childs,nestingLevel+1),nestingLevel));
                }
                else{
                    stringTree.push(createNode(node));
                }
                break;
        }
    }

    return stringTree;
}

function parseContent(content){
    var replaced = content.replace(/\((\s*<\w+(?:.|\s)*\w+\/?>\s*)\)/g,function (fmatch,match) {

        var p = parser(match),
            n = nodeTreeToStringTree(p,baseNesting);

        return "[\n" + '    '.repeat(baseNesting) + n.join(',\n'+'    '.repeat(baseNesting)) + '\n' + '    '.repeat(baseNesting-1) + "]";
    });
    return replaced;
}

function toJSX(pathToFile){
    var realPath = pathToFile;
    if(!realPath.match(/\.js$/)){
        realPath = realPath+=".js";
    }

    var fileContent = fs.readFileSync(realPath,'utf8');
    fileContent = parseContent(fileContent);

    var fileName = path.basename(realPath);
    var newFileName = "__"+fileName;
    var newPath = realPath.replace(fileName,newFileName);

    fs.writeFileSync(newPath,fileContent);
    return newPath;
}

module.exports = toJSX;


