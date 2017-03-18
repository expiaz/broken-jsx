 var fs = require('fs');
 var path = require('path');


//we'll need to run on the whole page

function getNode(match) {
    return {
        type: match[1] ? 'CLOSING' : match[4] ? 'AUTOCLOSING' : 'OPENING',
        tag: match[2],
        attr: match[3] || null,
        childs: [],
        content: '',
        rendered: '',
        indexs: {
            begin: match[5],
            end: match[5] + match[0].length
        }
    }
}

function getTextNode(node){
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
        return e.rendered !== '" "'
    }).map(function (e) {
        return e.rendered
    }).join(', ');
}

function replaceWith(content, replacement, begin, end) {
    return content.substring(0, begin) + replacement + content.substring(end, content.length);
}

function parser(html) {

    var regex = {
            jsx:/\((\s*<\w+(?:.|\s)*\w+>\s*)\)/g,
            tag:/<(\/)?(\w+)\s?((?:\w+(?:[-_]\w+)*="[^>"]*"\s*)*)?(\/)?>/g /*/<(\/)?(\w+)\s?([^>\/]*)(\/)?>/g*/,
            attr:/(\w+(?:[-_]\w+)*)=(?:("[^>"]*")|{([^>}]*)})/g
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


    console.log('[parse] html',html);



    html.replace(regex.tag, engine.bind(this));

    function engine() {
        node = getNode(Array.prototype.slice.call(arguments));
        console.log('[parser] matched',node);

        cursor.now = node.indexs.begin;

        if(cursor.now > cursor.last){
            console.log('[parser] text node finded ',html.substring(cursor.last, cursor.now),stack.length > 1);
            if(stack.length > 1){
                trimedHTML = trimHTML(html.substring(cursor.last, cursor.now));
                if(trimedHTML.length){
                    stack[stack.length - 1].childs.push(getTextNode(trimedHTML));
                }
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

            openingNode.content = html.substring(openingNode.indexs.begin,openingNode.indexs.end)

            stack[stack.length - 1].childs.push(openingNode);
        }
        else{
            if(node.attr){
                attributs = node.attr;
                node.attr = {};
                while(match.attr = regex.attr.exec(attributs)){
                    var m = match.attr[1].indexOf('-'),
                        c;
                    while(m !== -1){
                        c = match.attr[1].charAt(m + 1);
                        if(c.match(/\w/)){
                            match.attr[1] = match.attr[1].substring(0,m) + c.toUpperCase() + match.attr[1].substring(m+2);
                        }
                        else{
                            match.attr[1] = match.attr[1].substring(0,m) + '_' + match.attr[1].substring(m+2);
                        }

                        m = match.attr[1].indexOf('-');
                    }
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

        return html;
    }

    /*
    while(match.tag = regex.tag.exec(html)){

        node = getNode(match.tag);

        console.log('[parser] matched',node);

        cursor.now = node.indexs.begin;

        if(cursor.now > cursor.last){
            if(nbTagsPushed == 0) return;
            trimedHTML = trimHTML(html.substring(cursor.last, cursor.now));
            if(trimedHTML.length){
                nbTagsPushed++;
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

            nbTagsPushed++;
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
                nbTagsPushed++;
                stack[stack.length - 1].childs.push(node);
            }
        }

        cursor.last = node.indexs.end;
    }
    */

    return stack.pop().childs;

}

function nodeTreeToStringTree(nodeTree){

    var node, renderedNodeTree = nodeTree;

    for(var i = 0, l = renderedNodeTree.length; i < l; i++){
        node = renderedNodeTree[i];
        console.log('[nodeTreeToStringTree] child', node);
        switch(node.type){
            case 'TEXT':
                console.log('[nodeTreeToStringTree] text');
                node.rendered = createTextNode(node);
                break;
            case 'NODE':
                console.log('[nodeTreeToStringTree] node');
                if(node.childs.length){
                    console.log('[nodeTreeToStringTree] get childs',node.childs);
                    node.rendered = createNode(
                        node.tag,
                        node.attr,
                        nodeTreeToStringTree(node.childs)
                    );
                }
                else{
                    node.rendered = createNode(
                        node.tag,
                        node.attr
                    );
                }
                break;
        }
    }
    console.log('[nodeTreeToStringTree] rendered',renderedNodeTree);
    return renderedNodeTree;
}

function tagToJs(html,nodeTree){
    var i = 0, node, out = html, decalage = 0;
    for(var l = nodeTree.length; i < l; i++){
        node = nodeTree[i];
        console.log('[tagToJs] replacing ', node.content, node.rendered);
        out = replaceWith(out, node.rendered, node.indexs.begin + decalage, node.indexs.end + decalage);
        decalage += node.rendered.length - (node.indexs.end - node.indexs.begin);
    }
    return out;
}

function parseContent(content){

    return tagToJs(content,nodeTreeToStringTree(parser(content)));
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

var content = `
    <div class="col-xs-6 col-sm-6 col-md-6">
        <i class="icon fa fa-terminal"></i>
        <br/>
        <br/>
        <h4>BACK</h4>
        <p>PhP (Apache)<br/>Js (NodeJS)<br/>SQL & PL/SQL</p>
    </div>
`;

