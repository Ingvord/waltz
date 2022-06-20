/**
 *
 * @author Igor Khokhriakov <igor.khokhriakov@hzg.de>
 * @since 6/12/19
 */
import {TangoId} from "@waltz-controls/tango-rest-client";

const widget_settings = webix.protoUI({
    name: "widget_settings",
    _config() {
        return {
            cols: [{}]
        }
    },
    clear(){

    },
    removeAttribute(name) {
        const col = this.queryView({label: name});
        this.removeView(col);
        if (this.getChildViews().length === 1) {
            this.getChildViews()[0].define({
                width: 0
            });
            this.getChildViews()[0].resize();
        }
    },
    addAttributes(attrs){
        attrs.forEach(attr => this.addAttribute(attr));
    },
    /**
     *
     * @param {TangoAttribute} attr
     * @param force
     */
    addAttribute(attr) {
        const col = this.queryView({label: attr.name});
        if (col !== null) return;
        this.addView({
            id: attr.id,
            view: "button",
            type: "icon",
            icon: "wxi-trash",
            label: attr.name,
            click() {
                this.getParentView().config.root.removeAttribute(TangoId.fromMemberId(attr.id));
            }
        });
        if (this.getChildViews().length === 2) {
            this.getChildViews()[0].define({
                width: 1
            });
            this.getChildViews()[0].resize();
        }
    },
    /**
     *
     * @param {TangoCommand} cmd
     */
    addCommand(cmd){
        this.addAttribute(cmd);
    },
    /**
     *
     * @param {TangoDevice} device
     */
    addDevice(device) {
        //TODO?
    },
    $init(config) {
        webix.extend(config, this._config());
    }
}, webix.IdSpace, webix.ui.form);

export function newRemoveAttributeSettings(config) {
    return {
        view: "widget_settings",
        id: "settings",
        root: config.root,
        maxHeight:64
    };
}

export function toolbar_extension() {
    return [{
        view: "icon",
        icon: "mdi mdi-cog",
        tooltip: "Show/hide settings",
        click: function () {
            this.getTopParentView().toggleSettings();
        }
    }];
}
