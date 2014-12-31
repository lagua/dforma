var profile = (function(){
	var testResourceRe = /^dforma\/tests\//,
    copyOnly = function(filename, mid){
        var list = {
            "dforma/dforma.profile":1,
            "dforma/package.json":1
        };
        return (mid in list) || /(css|png|jpg|jpeg|gif|tiff)$/.test(filename);
    };

    return {
        resourceTags:{
        	test: function(filename, mid){
				return testResourceRe.test(mid);
			},
            copyOnly: function(filename, mid){
                return copyOnly(filename, mid);
            },
            amd: function(filename, mid){
                return !testResourceRe.test(mid) && !copyOnly(filename, mid) && /\.js$/.test(filename);
            }
        }
    };
})();
