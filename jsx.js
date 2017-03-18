var n = 'return (<Layout bindAction={this.props.bindAction.bind(this)} class="name" jeanLou="Ici">' +
        '<div class="jean">' +
            '<div cN={this.props.id}>' +
                '<a href="jsx.js">JXS</a>' +
                'Last' +
            '</div>' +
        '</div>' +
    '</Layout>' +
    '<Footer/>);';

var fs = require('fs');
var path = require('path');

function refactor(m){
    return {
        fullmatch: m[0],
        length: m[0].length,
        tag:m[1],
        attr:m[2] || null,
        child:m[3] || null,
        index: [m.index,m.index+m[0].length]
    }
}

function trimHTML(html){
    return html.replace(/\s*$/,'').replace(/^\s*/,'').replace(/\n*\r*\t*/,'');
}

function ObjToString(obj){
    if(typeof obj != "object")
        return obj;

    if(!Object.keys(obj))
        return "{}";

    var ret = "";
    for(var k in obj){
        if(ret.length == 0)
            ret += " {"+k+": "+obj[k];
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
        return "[]";

    var ret = "";
    for(var i = 0, l = arr.length; i<l; i++){
        if(ret.length == 0)
            ret += " [\n" + '\t'.repeat(stackStair+1) + arr[i];
        else
            ret += ",\n "+ '\t'.repeat(stackStair+1) + arr[i];
    }
    ret += '\n' + '\t'.repeat(stackStair) + "]";

    return ret;
}

function createVNode(tag,attrs,childs){
    return 'A.createElement("'+tag+'",'+(attrs != null ? ObjToString(attrs) : ' null')+','+(childs != null && childs.length != 0 ? childs : ' null')+')';
}

function createVoidNode(content){
    return 'A.createVoidElement("'+content+'")';
}

function parse(content,stack){

    if(stack == void 0)
        stack = 1;

    var nodes = [],
        tagReg = /<(\w+)\s?([^>\/]*)(?:\/>|>((?:.|\s)*)<\/\1>)/g,
        tagMatch,
        cursor = 0;
    while(tagMatch = tagReg.exec(content)){

        console.log(tagMatch);

        tagMatch = refactor(tagMatch);
        if(tagMatch.attr != null){
            var regAttr = /(\w+)=(?:("[^"]+")|{([^}]+)})/g;
            var attrMatch = [];
            var attr = {};
            while(attrMatch = regAttr.exec(tagMatch.attr)){
                attr[attrMatch[1]] = attrMatch[2] || attrMatch[3];
            }
            tagMatch.attr = attr;
        }

        console.log('attr');

        console.log(tagMatch.index[0] + ">" + cursor);

        if(tagMatch.index[0] > cursor) {
            var html = content.substring(cursor, tagMatch.index[0]);
            var trimed = trimHTML(html);
            if(trimed.length){
                console.log('pushing voidNode bf',trimed);
                nodes.push(createVoidNode(trimed));
            }

        }

        console.log('bf content');

        cursor = tagMatch.index[1];

        console.log('cursor');

        if(tagMatch.child != null){
            console.log('bf childs');
            tagMatch.child = parse(tagMatch.child,stack+1);
            console.log('af childs');
        }

        console.log('childs');

        nodes.push(createVNode(tagMatch.tag,tagMatch.attr,tagMatch.child));
    }
    console.log(cursor + ">" + content.length);
    if(cursor < content.length){
        var html = content.substring(cursor,content.length);
        var trimed = trimHTML(html);
        if(trimed.length){
            console.log('pushing voidNode af',trimed);
            nodes.push(createVoidNode(trimed));
        }

    }

    console.log('af content');

    return ArrayToString(nodes,stack);

}

function parseContent(content){
    var replaced = content.replace(/\((\s*<\w+(?:.|\s)*\w+>\s*)\)/g,function (fmatch,match) {
        return parse(match);
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