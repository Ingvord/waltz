/** @module DeviceView
 *  @memberof ui
 */
(function () {
    /**
     * Extends {@link https://docs.webix.com/api__refs__ui.tabview.html webix.ui.tabview}
     * @property {String} name
     * @memberof ui.DeviceView
     * @namespace device_view
     */
 var device_view = webix.protoUI(
        /** @lends  device_view.prototype */
        {
    _device : null,
    name: "device_view",
    /**
     * @constructor
     * @memberof ui.DeviceView.device_view
     */
    $init: function (config) {
        this._device = config.device;

        //set header Device [...]
    },
    defaults: {
        animate: false
    }
}, webix.IdSpace, webix.ui.tabview);
    /**
     * @param config
     * @memberof ui.DeviceView
     */
TangoWebapp.ui.newDeviceView = function (config) {
    return {
        header: "<span class='webix_icon mdi mdi-chip'></span>[<span class='webix_strong'>" + config.device.display_name + "</span>]",
        close : true,
        borderless: true,
        body  : {
            view: "device_view",
            id   : config.id,
            cells: [
                {
                    header: "<span class='tab_bold'>" + "Properties" + "</span>",
                    body: TangoWebapp.ui.newDevicePropertiesView(config.device)
                },
                {
                    header: "<span class='tab_bold'>" + "Polling" + "</span>",
                    body: TangoWebapp.ui.newDevicePollingView(config.device)
                },
                {
                    header: "<span class='tab_bold'>" + "Events" + "</span>",
                    body: TangoWebapp.ui.newDeviceEventsView(config.device)
                },
                {
                    header: "<span class='tab_bold'>" + "Attributes config" + "</span>",
                    body: TangoWebapp.ui.newDeviceAttrConfigView(config.device)
                },
                //{
                //    header: "Pipes config",
                //    body  : TangoWebapp.ui.newDevicePipeConf(config.device)
                //},
                //{
                //    header: "Attributes properties",
                //    body  : TangoWebapp.ui.newDeviceAttrProps(config.device)
                //},
                {
                    header: "<span class='tab_bold'>" + "Logging" + "</span>",
                    body: TangoWebapp.ui.newDeviceLoggingView(config.device)
                }
            ]
        }
    };
};
})();