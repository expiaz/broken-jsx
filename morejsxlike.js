
/*
var fs = require('fs');
var path = require('path');
 */

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

function createNode(tag,attrs,childs){
    tag = tag.charCodeAt(0) > 90 ? '"'+tag+'"' : tag;
    attrs = attrs !== void 0 && attrs != null ? ObjToString(attrs) : 'null';
    childs = childs !== void 0 && childs != null ? Array.isArray(childs) && childs.length ?  childrensToString(childs) : childs : 'null';
    return 'A.createElement(' + tag + ', ' + attrs + ', ' + childs + ')';
}

function createTextNode(node){
    if(typeof node == "string")
        return '"'+node+'"';
    else
        return '"'+node.content+'"';
}

function trimHTML(html){
    console.log('[trimHTML] in with '+ JSON.stringify(html));
    var safe =  html
        .replace(/[\n\r\t]/g,'')
        .replace(/ +/g,' ')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    console.log('[trimHTML] out with '+ JSON.stringify(safe));
    return safe;
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

function childrensToString(childs) {
    //delete blank space between tags
    return childs.filter(function (e) {
        return e !== '" "'
    }).join(', ');
}

function parser(html) {

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
        stack = [{childs:[]}], node, trimedHTML, attributs;



    while(match.tag = regex.tag.exec(html)){

        node = getNode(match.tag);

        cursor.now = node.indexs.begin;

        if(cursor.now > cursor.last){
            trimedHTML = trimHTML(html.substring(cursor.last, cursor.now));
            if(trimedHTML.length){
                stack[stack.length - 1].childs.push(getVoidNode(trimedHTML));
            }
        }

        if(node.type == 'CLOSING'){
            //end of tag </tagName>
            var openingNode = stack.pop(),
                closingNode = node;

            if(openingNode.tag != closingNode.tag)
                return;

            openingNode.type = 'NODE';

            openingNode.indexs.end = closingNode.indexs.end;

            stack[stack.length - 1].childs.push(openingNode);
        }
        else{

            if(node.attr){
                attributs = node.attr;
                node.attr = {};
                while(match.attr = regex.attr.exec(attributs)){
                    node.attr[match.attr[1]] = match.attr[2] || match.attr[3];
                }
            }
            if(node.type == 'OPENING'){
                //begining tag <tagName ...>
                stack.push(node);
            }
            else{
                //autoclosing tag <tagName ... />
                node.type = 'NODE';
                stack[stack.length - 1].childs.push(node);
            }
        }

        cursor.last = node.indexs.end;
    }

    if(html.length > cursor.last){
        trimedHTML = trimHTML(html.substring(cursor.last, html.length));
        if(trimedHTML.length){
            stack[stack.length - 1].childs.push(getVoidNode(trimedHTML));
        }
    }

    return stack.pop().childs;

}

function nodeTreeToStringTree(nodeTree){

    var stringTree = [],
        node;

    for(var i = 0, l = nodeTree.length; i < l; i++){
        node = nodeTree[i];
        switch(node.type){
            case 'TEXT':
                stringTree.push(createTextNode(node));
                break;
            case 'NODE':
                if(node.childs.length){
                    stringTree.push(createNode(
                        node.tag,
                        node.attr,
                        nodeTreeToStringTree(node.childs)
                    ));
                }
                else{
                    stringTree.push(createNode(
                        node.tag,
                        node.attr
                    ));
                }
                break;
        }
    }

    return childrensToString(stringTree)
}

function parseContent(content){
    var replaced = content.replace(/\((\s*<\w+(?:.|\s)*\w+\/?>\s*)\)/g,function (fmatch,match) {
        console.log('[parseContent] in with '+JSON.stringify(match));
        return "[" + nodeTreeToStringTree(parser(match)) + "]";
    });
    return replaced;
}

/*
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
*/



//module.exports = toJSX;

var content = `
    (
        <br/>
        <div onClick={this.props.nameHandler}>
            Hello <span>Guys</span>
        </div>
        <TagName prop={a}/>
    )
`;

function test(content) {
    console.log(parseContent(content));
}

test(content);