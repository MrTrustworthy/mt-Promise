
var async = function(time, func){
    window.setTimeout(func, time);
};


var success = "Success";
var resolveValue = success;

var assert = function(val){
    if(val !== resolveValue){
        console.trace("ERROR!!");
        return false;
    }
    return true;
};

var write = function(number, text){
    var el = document.getElementById("test" + number.toString());
    el.innerHTML += text;
};


var test_1 = function(){
    var d = new Deferred();
    var p = d.promise;

    async(100, function(){
        d.resolve(success);
    });
    p.then(function(val){
        assert(val) && write(1, val);
    });
};

var test_2 = function(){
    var d = new Deferred();
    var p = d.promise;

    d.resolve(success);
    async(200, function(){
        p.then(function(val){
            assert(val) && write(2, val);
        });
    });
};


var test_3 = function(){
    var d = new Deferred();
    var p = d.promise;

    async(100, function(){
        d.resolve(success);
    });
    p.then(function(val){
        assert(val) && write(3, val);
    });
    async(200, function(){
        p.then(function(val){
            assert(val) && write(3, val);
        });
    });
};

var test_4 = function(){
    var d = new Deferred();
    var p = d.promise;


    d.resolve(success);

    p.then(function(val){
        assert(val) && write(4, val);
        return success;
    }).then(function(val){
        assert(val) && write(4, val);
    });
};

var test_5 = function(){
    var d = new Deferred();
    var p = d.promise;

    async(100, function(){
        d.resolve(success);
    });
    p.then(function(val){
        assert(val) && write(5, val);
        return success;
    }).then(function(val){
        assert(val) && write(5, val);
        return success;
    }).then(function(val){
        assert(val) && write(5, val);
    });
};

var test_6 = function(){
    var d = new Deferred();
    var p = d.promise;


};

var runTests = function(){



    test_1();
    test_2();
    test_3();
    test_4();
    test_5();
    test_6();






};
