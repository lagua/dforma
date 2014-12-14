define("dforma/util/string/cleanWhitespace", ["dojo/_base/lang","dojo/dom-construct"], function(lang,domConstruct) {
lang.getObject("dforma.util.string", true);

var _cleanWhitespaceRecursive = function(node) {
	for (var i=0; i<node.childNodes.length; i++) {
		var child = node.childNodes[i];
		if(child.nodeType == 3 && !/\S/.test(child.nodeValue)) {
			node.removeChild(child);
			i--;
		}
		if(child.nodeType == 1) {
			_cleanWhitespaceRecursive(child);
		}
	}
	return node;
};

var cleanWhitespace = function(/*String*/ value){
	var div = domConstruct.create("div",{
		innerHTML:value
	});
	return _cleanWhitespaceRecursive(div).innerHTML;
};

String.prototype.cleanWhitespace = function() {
	return cleanWhitespace(this);
}

dforma.util.string.cleanWhitespace = cleanWhitespace;
return cleanWhitespace;

});