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

function getJsNode(node) {
    return {
        type: node.brace == '{' ? 'OPENING' : 'CLOSING',
        content: node[1] || '',
        childs: [],
        indexs: {
            begin: node.index,
            end: node[1] ? node.index + node[0].length : 0
        }
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

function createJsNode(node) {
    if(typeof node == "string")
        return node;
    else
        return node.content;
}

function trimHTML(html){
    var safe =  html
        .replace(/^\s*/,'')
        .replace(/\s*$/,'')
        .replace(/[\n\r\t]/g,'')
        .replace(/ +/g,' ')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
            js:/{([^}]*)}/g,
            tag:/<(\/)?(\w+)\s?((?:\w+(?:[-_]\w+)*(?:=(?:(?:"[^>"]*")|(?:{[^>}]*})))?\s*)*)?(\/)?>/g /*/<(\/)?(\w+)\s?([^>\/]*)(\/)?>/g*/,
            attr:/(\w+(?:[-_]\w+)*)(?:=(?:("[^>"]*")|{([^>}]*)}))?/g
        },
        match = {
            tag:[],
            attr:[],
            js:[]
        },
        cursor = {
            last:0,
            now:0,
            child:{
                last:0,
                now:0
            }
        },
        stack = [{childs:[]}], jsChildStack = [], node, trimedHTML, attributs;




    //html.replace(regex.tag, engine.bind(this));

    function engine() {
        node = getNode(Array.prototype.slice.call(arguments));

        cursor.now = node.indexs.begin;

        if(cursor.now > cursor.last){
            if(stack.length > 1){
                var contentChild = html.substring(cursor.last, cursor.now),
                    jsChild,
                    braces = {
                        opening: 0,
                        closing:0
                    };
                cursor.child.last = 0;
                /*
                braces.opening = (contentChild.match(/{/g) || []).length;
                braces.closing = (contentChild.match(/}/g) || []).length;
                console.log('[parser] JS nodes braces ',braces);
                if(braces.opening == 0 && braces.closing == 0){
                    trimedHTML = trimHTML(contentChild);
                    if(trimedHTML.length){
                        (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(getTextNode(trimedHTML));
                    }
                }

                else if(braces.opening == braces.closing){
                    // no tags inside, only pur js / html
                    while(match.js = regex.js.exec(contentChild)){
                        jsChild = getJsNode(match.js);
                        cursor.child.now = jsChild.indexs.begin;
                        if(cursor.child.now > cursor.child.last){
                            trimedHTML = trimHTML(contentChild.substring(cursor.child.last, cursor.child.now));
                            if(trimedHTML.length){
                                (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(getTextNode(trimedHTML));
                            }
                        }
                        (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(jsChild);
                        cursor.child.last = jsChild.indexs.end;
                    }
                    if(cursor.child.last < contentChild.length){
                        trimedHTML = trimHTML(contentChild.substring(cursor.child.last, contentChild.length));
                        if(trimedHTML.length){
                            (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(getTextNode(trimedHTML));
                        }
                    }
                }

                else{
                */
                    /*
                    var nextMatch;
                    braces.opening = contentChild.indexOf('{',cursor.child.last);
                    braces.closing = contentChild.indexOf('}',cursor.child.last);
                    if(braces.opening == -1 && braces.closing == -1){
                        nextMatch = {
                            index: braces.opening
                        }
                    }
                    else if(braces.opening == -1){
                        nextMatch = {
                            brace: '}',
                            index: braces.closing
                        }
                    }
                    else if(braces.closing == -1){
                        nextMatch = {
                            brace: '{',
                            index: braces.opening
                        }
                    }
                    else if(braces.opening <= braces.opening){
                        nextMatch = {
                            brace: '{',
                            index: braces.opening
                        }
                    }
                    else{
                        nextMatch = {
                            brace: '}',
                            index: braces.closing
                        }
                    }

                    while(nextMatch.index !== -1){
                        console.log('[parser] match : ', nextMatch.brace, nextMatch.index, jsChildStack, stack);
                        cursor.child.now = nextMatch.index;
                        if(cursor.child.last < cursor.child.now){
                            var beforeJsContent = contentChild.substring(cursor.child.last,cursor.child.now);
                            console.log('[parser] there is content before braces ', beforeJsContent);
                            beforeJsContent = trimHTML(beforeJsContent);
                            if(beforeJsContent.length){
                                (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(createTextNode(beforeJsContent));
                            }
                        }
                        if(nextMatch.brace == '{'){
                            jsChildStack.push(getJsNode({
                                brace: nextMatch.brace,
                                index: nextMatch.index
                            }));
                        }
                        else{
                            var openingBrace = jsChildStack.pop(),
                                closingBrace = {
                                    index: nextMatch.index
                                };
                            openingBrace.type = 'JS';
                            openingBrace.indexs.end = closingBrace.index;
                            (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(openingBrace);
                        }
                        cursor.child.last = cursor.child.now + 1;

                        braces.opening = contentChild.indexOf('{',cursor.child.last);
                        braces.closing = contentChild.indexOf('}',cursor.child.last);
                        if(braces.opening == -1 && braces.closing == -1){
                            nextMatch = {
                                index: -1
                            }
                        }
                        else if(braces.opening == -1){
                            nextMatch = {
                                brace: '}',
                                index: braces.closing
                            }
                        }
                        else if(braces.closing == -1){
                            nextMatch = {
                                brace: '{',
                                index: braces.opening
                            }
                        }
                        else if(braces.opening < braces.closing){
                            nextMatch = {
                                brace: '{',
                                index: braces.opening
                            }
                        }
                        else{
                            nextMatch = {
                                brace: '}',
                                index: braces.closing
                            }
                        }

                    }
                    */

                    var braceReg = /[{}]/g;
                    console.log('[parser] content to parse : ', contentChild);
                    while(match.js = braceReg.exec(contentChild)){
                        console.log('[parser] match : ', match.js);
                        cursor.child.now = match.js.index;
                        if(cursor.child.last < cursor.child.now){
                            var beforeJsContent = contentChild.substring(cursor.child.last,cursor.child.now);
                            console.log('[parser] their is content before braces ', beforeJsContent);
                            beforeJsContent = trimHTML(beforeJsContent);
                            if(beforeJsContent.length){
                                (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(createTextNode(beforeJsContent));
                            }
                        }
                        if(match.js[0] == '{'){
                            jsChildStack.push(getJsNode({
                                brace: match.js[0],
                                index: match.js.index
                            }))
                        }
                        else{
                            var openingBrace = jsChildStack.pop(),
                                closingBrace = {
                                    index: match.js.index
                                };
                            openingBrace.type = 'JS';
                            openingBrace.indexs.end = closingBrace.index;
                            (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(openingBrace);
                        }
                        cursor.child.last = cursor.child.now + 1;
                    }


                    if(cursor.child.last < contentChild.length){
                        var afterJsContent = contentChild.substring(cursor.child.last,contentChild.length);
                        console.log('[parser] their is content after braces ', afterJsContent);
                        afterJsContent = trimHTML(afterJsContent);
                        if(afterJsContent.length){
                            (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(createTextNode(afterJsContent));
                        }
                    }

                //}
            }
        }

        if(node.type == 'CLOSING'){
            //end of tag </tagName>
            var openingNode = (jsChildStack.length > 0 ? jsChildStack : stack).pop(),
                closingNode = node;

            if(openingNode.tag != closingNode.tag)
                return;

            openingNode.type = 'NODE';

            openingNode.indexs.end = closingNode.indexs.end;

            openingNode.content = html.substring(openingNode.indexs.begin,openingNode.indexs.end);

            (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(openingNode);
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
                    node.attr[match.attr[1]] = match.attr[2] || match.attr[3] || "true";
                }
            }
            if(node.type == 'OPENING'){
                //begining tag <tagName ...>
                (jsChildStack.length > 0 ? jsChildStack : stack).push(node);
            }
            else{
                //autoclosing tag <tagName ... />
                node.type = 'NODE';
                (jsChildStack.length > 0 ? jsChildStack[jsChildStack.length - 1] : stack[stack.length - 1]).childs.push(node);
            }
        }

        cursor.last = node.indexs.end;
    }


    while(match.tag = regex.tag.exec(html)){

        var args = [
            match.tag[0],
            match.tag[1],
            match.tag[2],
            match.tag[3],
            match.tag[4],
            match.tag.index
        ];


        engine.apply(null,args);

        /*

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

         */
    }


    return stack.pop().childs;

}

function rendering(nodeTree){

    var node, renderedNodeTree = nodeTree;

    for(var i = 0, l = renderedNodeTree.length; i < l; i++){
        node = renderedNodeTree[i];
        switch(node.type){
            case 'TEXT':
                node.rendered = createTextNode(node);
                break;
            case 'NODE':
                if(node.childs.length){
                    node.rendered = createNode(
                        node.tag,
                        node.attr,
                        rendering(node.childs)
                    );
                }
                else{
                    node.rendered = createNode(
                        node.tag,
                        node.attr
                    );
                }
                break;
            case 'JS':
                node.rendered = createJsNode(node);
                break;
        }
    }
    return renderedNodeTree;
}

function tagToJs(html,nodeTree){
    var i = 0, node, out = html, decalage = 0;
    for(var l = nodeTree.length; i < l; i++){
        node = nodeTree[i];
        out = replaceWith(out, node.rendered, node.indexs.begin + decalage, node.indexs.end + decalage);
        decalage += node.rendered.length - (node.indexs.end - node.indexs.begin);
    }
    return out;
}

function parseContent(content){
    return tagToJs(content,rendering(parser(content)));
}


module.exports = parseContent;


var content = `
    <div>
        jean like { Jean <div>{ "Hi" }</div> }
    </div>
`;

console.log(JSON.stringify(parser(content)));