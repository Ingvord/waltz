TangoWebapp.DeviceTabActivator = {
    activate:function(){
        this.show();

        //update tab label
        $$('mainTabview').getTabbar().config.options[0].value = this.name + " [" +TangoWebapp.getDevice().name+ "]";
        $$('mainTabview').getTabbar().refresh();
    }
};