/**
 * Main controller of the TangoWebapp applcation. It is responsible for creating main application UI after platform context has been initialized
 *
 * @type {TangoWebapp.MainController}
 */
TangoWebapp.MainController = MVC.Controller.extend('main', {
    /**
     * This is the main entry point of the application. This function is invoked after jmvc has been completely initialized.
     *
     * @param {Object} event - event.data contains fully properly initialized PlatformContext model
     * @see PlatformContext
     */
    "platform_context.create subscribe": function (event) {
        //TODO deal with it somehow
        TangoWebapp.consts.LOG_DATE_FORMATTER = webix.Date.dateToStr("%c");

        if ($$('tango-webapp') === undefined) {
            webix.ui({
                id: 'tango-webapp',
                multi: true,
                cols: [
                    {
                        header: "<span class='webix_icon fa-sitemap'></span> Devices Tree",
                        body: {
                            context: event.data,
                            view: 'devices_tree'
                        }
                    },
                    {width: 15},
                    {
                        type: 'space',
                        context: event.data,
                        body: {
                            view: "tabview",
                            id: "main-tabview",
                            tabbar: {
                                height: 40,
                                popupWidth: 480,
                                tabMinWidth: TangoWebapp.consts.NAME_COLUMN_WIDTH
                            },
                            cells: [
                                {
                                    header: "<span class='webix_icon fa-dashboard'></span> Dashboard",
                                    body: {
                                        id: 'dashboard',
                                        view: "dashboard",
                                        borderless: true,
                                        type: 'space'
                                    }
                                }
                            ]
                        }
                    },
                    {width: 15},
                    {
                        header: "<span class='webix_icon fa-keyboard-o'></span> Device Test Panel",
                        width: 300,
                        collapsed: true,
                        body: {
                            context: event.data,
                            view: 'test_device_panel',
                            id: 'test-device-panel'
                        }
                    }
                ]
            }, $$('content'));

            webix.html.remove(document.getElementById('ajax-loader'));
        }

        webix.ui.fullScreen();
    },
    _promise_device: function (data) {
        var promise;
        var id = data.id;
        if (PlatformContext.devices.exists(id))
            promise = webix.promise.resolve(PlatformContext.devices.getItem(id));
        else
            promise = PlatformContext.tango_hosts.getItem(data.host_id).fetchDevice(data.name);
        return promise.then(function (device) {
            PlatformContext.devices.setCursor(device.id);
            return device;
        });
    },
    "tango_webapp.device_open subscribe": function (event) {
        var promise = this._promise_device(event.data);

        promise.then(function (device) {
            if (!device.info.exported) throw "Device[" + device.id + "] is not exported";

            var device_view_id = "view/" + device.id;
            if (!$$(device_view_id)) {
                $$("main-tabview").addView(
                    TangoWebapp.ui.newDeviceView(
                        {
                            device: device,
                            id: device_view_id
                        })
                );
            }
            $$(device_view_id).show();

            $$(device_view_id).$$(event.data.tab).activate();
        }).fail(TangoWebappHelpers.error);
    },
    "tango_webapp.device_view subscribe": function (event) {
        var promise = this._promise_device(event.data);

        promise.then(function (device) {
            if (!device.info.exported) throw "Device[" + device.id + "] is not exported";
            
            var device_view_id = "monitor/" + device.id;
            if (!$$(device_view_id)) {
                $$("main-tabview").addView(
                    TangoWebapp.ui.newDeviceMonitorView({
                        device: device,
                        id: device_view_id
                    })
                );
            }
            $$(device_view_id).show();

            $$(device_view_id).activate();
        }).fail(TangoWebappHelpers.error);
    },
    "tango_webapp.device_delete subscribe": function (event) {
        var promise = this._promise_device(event.data);

        promise.then(function (device) {
            return device.host.fetchDatabase();
        }).then(function (db) {
            return db.deleteDevice(event.data.name);
        }).then(function () {
            $$('devices-tree').updateRoot();
        }).fail(TangoWebappHelpers.error);
    }
});