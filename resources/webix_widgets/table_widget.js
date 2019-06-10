import newToolbar from "./attrs_monitor_toolbar.js";

const kPersistentColumns = ["id", "device", "remove"];

export const TableWidgetController = class extends MVC.Controller {
    buildUI(platform_api) {
        platform_api.ui_builder.add_mainview_item(newTableWidgetTab());
    }
    /**
     *
     * @param {PlatformApi} platform_api
     */
    async initialize(platform_api){
        const host = await PlatformContext.rest.fetchHost("localhost:10000");
        const device = await host.fetchDevice("sys/tg_test/1");
        let attr = await device.fetchAttr("double_scalar");


        $$('table_widget').$$('datatable').addAttribute(attr);

        attr = await device.fetchAttr("long_scalar");
        $$('table_widget').$$('datatable').addAttribute(attr);

    }
};

//disable Xenv widget for master
TableWidgetController.initialize();

const table_datatable = webix.protoUI({
    name:"table_datatable",
    _config() {
        return {
            columns: [
                {id: "id", hidden: true},
                {id: "device", header: "Device", fillspace: true},
                {
                    id: "remove", header: "<span class='remove-all webix_icon fa-trash'></span>", width: 30,
                    tooltip: "Remove all",
                    template: function (obj) {
                        return "<span class='remove-single webix_icon fa-trash'></span>";
                    }
                }
            ],
            on:{
                onHeaderClick(obj){
                    if(obj.column === 'remove'){
                        this.clear();
                    }
                },
                onItemClick(id) {
                    const device_id = id.row;

                    PlatformContext.devices.setCursor(device_id);


                    const attr_name = id.column;


                    if(kPersistentColumns.includes(attr_name)) return;

                    OpenAjax.hub.publish("tango_webapp.item_selected", {
                        data: {
                            id: `${device_id}/${attr_name}`,
                            kind: 'attrs'
                        }
                    });
                }
            }
        }
    },
    clear(){
        this.clearAll();
        this._tracked_attrs = new Set([]);
        this.removeColumns();
    },
    removeColumns(){
        const columns = this.config.columns;
        this.config.columns = columns.filter(column => kPersistentColumns.includes(column.id));
        this.refreshColumns();
    },
    addColumn(attr){
        const columns = this.config.columns;
        columns.splice(columns.length - 1,0,{
            device_id: attr.device_id,
            id: attr.name,
            header: `${attr.display_name} (${attr.info.display_unit})`,
            template:function(obj){
                function getQualityIcon(obj){
                    switch (obj[attr.name + "_quality"]) {
                        case "ATTR_ALARM":
                        case "ATTR_INVALID":
                            return `<span class="webix_icon fa-exclamation-triangle" style="color: red"></span>`;
                        case "ATTR_WARNING":
                            return `<span class="webix_icon fa-exclamation-triangle" style="color: orange"></span>`;
                        case "FAILURE":
                            return `<span class="webix_icon fa-exclamation" style="color: red"></span>`;
                        case "VALID":
                        default:
                            return "";
                    }
                }

                return `${getQualityIcon(obj)}${obj[attr.name]}`;
            },
            fillspace: true
        });
        this.refreshColumns();
    },
    _tracked_attrs:new Set([]),
    /**
     *
     * @param {TangoAttribute} attr
     */
    addAttribute(attr){
        if(!attr.isScalar()) return;
        if(this.config.columns.filter(column => column.id === attr.name).length === 0)
            this.addColumn(attr);

        const item = this.getItem(attr.device_id);
        if(item ===  undefined)
            this.add({
                id: attr.device_id,
                device: attr.getDevice().display_name,
                [attr.name]: "",
                [attr.name + "_quality"]: "",
                _device: attr.getDevice(),
                _attrs:new Set(this._tracked_attrs)
            });

        this._tracked_attrs.add(attr.name);
        this.data.each(item => item._attrs.add(attr.name));

        this.run();
    },
    async addDevice(id){
        let device = TangoDevice.find_one(id);
        if(device == null) {
            try {
                const parts = id.split('/');
                const tango_host = parts.shift();
                device = await PlatformContext.rest.fetchHost(tango_host)
                    .then(host => host.fetchDevice(parts.join('/')))
            } catch (e) {
                TangoWebappHelpers.error(`Failed to fetch device[id=${id}]`,e);
                return;
            }
        }

        this.add({
            id: device.id,
            device: device.display_name,
            _device: device,
            _attrs:new Set(this._tracked_attrs)
        });
    },
    run(){
        this.data.each(item => {
            item._device.fetchAttrValues([...item._attrs]).then(resp => {
                const update = {};
                resp.forEach(output => {
                    update[output.name] = output.value;
                    update[output.name + "_quality"] = output.quality;
                });

                //TODO remove failed attrs

                this.updateItem(item.id, update);
            })
        });
    },
    $init(config) {
        webix.extend(config, this._config());

        this.addDrop(this.getNode(),{
            /**
             * @function
             * @memberof  ui.AttrsMonitorView.attrs_monitor_view
             * @see {@link https://docs.webix.com/api__dragitem_onbeforedrop_event.html| onBeforeDrop}
             */
            $drop:function(source, target){
                const dnd = webix.DragControl.getContext();
                if(dnd.from.config.$id === 'attrs') {
                    const attr = TangoAttribute.find_one(dnd.source[0]);
                    if (attr == null) return false;

                    this.addAttribute(attr);
                }
                if(dnd.from.config.view === 'devices_tree_tree'){
                    this.addDevice(dnd.source[0]);
                }
                return false;
            }.bind(this)
        });
    }
}, webix.DragControl, webix.ui.datatable);

function newTableWidgetTable(){
    return {
        id:"datatable",
        view:"table_datatable",
        onClick: {
            "remove-single":function(event, id){
                this.remove(id.row);
                if(this.count() === 0) this.removeColumns();
                return false;
            }
        }
    }
}

const table_widget = webix.protoUI({
    name: "table_widget",
    _ui(){
        return {
            rows:[
                newTableWidgetTable(),
                newToolbar()
            ]
        }
    },
    run(){
        this.$$('datatable').run();
    },
    $init(config){
        webix.extend(config, this._ui())
    }

}, TangoWebappPlatform.mixin.Runnable, webix.IdSpace, webix.ui.layout);

export function newTableWidgetTab(){
    return {
        header: "<span class='webix_icon fa-table'></span> TableWidget",
        borderless: true,
        body:
            {
                id: "table_widget",
                view: "table_widget"
            }
    };
}