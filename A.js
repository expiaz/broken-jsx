var A = (function () {

    function A() {

    }

    A.prototype.htmlAttributeNotation = function (attribut) {
        return attribut.replace(/[A-Z_]/g, function (g,i) {
            return '-' + (g == '_' ? '' : g.toLowerCase());
        })
    }

    //dom node
    A.prototype.h = function (vNode) {

        var domNode = document.createElement(vNode.tag);
        if(vNode.attr){
            for(var attribute in vNode.attr){
                domNode.setAttribute(this.htmlAttributeNotation(attribute),vNode.attr[attribute]);
            }
        }
        if(vNode.childs){
            for(var child of vNode.childs){
                if(typeof child == "string"){
                    domNode.appendChild(
                        document.createTextNode(child)
                    );
                }
                else{
                    domNode.appendChild(
                        child
                    );
                }
            }
        }

        return domNode;

    }

    A.prototype.vDomNode = function (tag,attr,childs) {
        this.tag = tag;
        this.attr = attr;
        this.childs = childs;
    }

    A.prototype.vComponentNode = function (compo,attr,childs) {
        this.component = compo;
        this.attr = attr;
        this.childs = childs;
    }


    A.prototype.createElement = function (tag,attr) {
        var childs = Array.prototype.slice.call(arguments,2);

        if(typeof tag == "string"){
            return this.h(new this.vDomNode(tag,attr,childs));
        }
        else{
            return new this.vComponentNode(tag,attr,childs);
        }

    }

    A.prototype.render = function (content,container) {
        container.innerHTML  = content;
        container.firstChild.offsetWidth;
    }

    A.prototype.unmount = function (container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
// Force reflow and style calculation.
        container.firstChild;
        container.offsetWidth;
    }

    return A;

}());

module.exports = new A();