MVCOptions = {
    onload: true,
    env: "test",
    done_loading : function(){
        print('\n\nRUNNING UNIT TESTS\nremember to update apps/pre_experiment_data_collector/index.html\n');
        OpenAjax.hub.subscribe("jmvc.test.assertions.update", this.report);
        OpenAjax.hub.subscribe("jmvc.test.test.complete", this.update_test);
        OpenAjax.hub.subscribe("jmvc.test.unit.complete", this.unit_results);
        OpenAjax.hub.subscribe("jmvc.test.test.start", this.start_test);
        MVC.Test.Unit.run()
    },
    start_test : function(called, test){
        print(test.name.toUpperCase()+" TEST ------------------------");
    },
    report : function(called, assertions){
        
        clean_messages = function(messages){
        	for(var m = 0; m < messages.length; m++){
        		messages[m] = messages[m].replace(/</g,'&lt;').replace(/\n/g,'\\n');
        	}
        	return messages
        }
        var test_name = assertions._test_name.replace("test_","");

        
        add_s = function(array){
        	return array == 1 ? '' : 's'
        };
        
        if(assertions.failures == 0 && assertions.errors == 0){
    		print('  Passed - '+test_name+" : "+assertions.assertions+' assertion'+add_s(assertions.assertions)+  
                (assertions.messages.length> 0?' \n     ':'')+
    			clean_messages(assertions.messages).join("\n     ") )
    		
    	}else{
    		
    		print('\n  Failed - '+test_name+" : "+assertions.assertions+' assertion'+
            add_s(assertions.assertions)+
    		', '+assertions.failures+' failure'+add_s(assertions.failures)+
    		', '+assertions.errors+' error'+add_s(assertions.errors)+
            (assertions.messages.length> 0? ' \n     ': '')+
    			clean_messages(assertions.messages).join("\n     ") )
            print(" ");
    	}
    },
    update_test: function(called,test){
	    print('\n  Completed '+test.name+' test ('+test.passes+'/'+test.test_names.length+ ')\n')
    },
    unit_results : function(called,test){
        print('\COMPLETED UNIT TESTS ('+test.passes+'/'+test.tests.length+')' + (test.passes == test.tests.length ? ' Wow!' : '')+"\n" )
    }
}

load('jmvc/rhino/compression/setup.js');
window.location = 'apps/pre_experiment_data_collector/index.html';
