import {kUserActionDone, kUserActionsChannel, UserAction} from "models/user_action";
import {BoundedReverseList} from "views/mixins";

function log(target){
    return function(action){
        target.addFirst(action);
    }
}

/**
 *
 * @module UserLog
 * @memberof ui
 * @author Igor Khokhriakov <igor.khokhriakov@hzg.de>
 * @since 9/10/18
 */
const user_log = webix.protoUI({
    name: 'user_log',
    ui(){
        return {
            /**
             *
             * @param {UserAction} action
             * @return {string}
             */
            template(action){
                return `<div>${action.hasFailed() ? '<span class="webix_icon red mdi mdi-alert"></span>' : ''}${action.redoable ? '<span class="webix_icon mdi mdi-redo-variant"></span>' : ''}<strong>${new Date(action.id)}</strong></div>${action.toMessage()}`;
            },
            click(id){
                const action = this.getItem(id);
                if(action.redoable)
                webix.confirm(`<div>Confirm redo action ${action.action} on ${action.target}?</div>${action.toMessage()}`, "confirm-warning")
                    .then(() => {
                        Object.assign(action,{id: +new Date()}).submit();
                    });
            }
        }
    },
    $init(config){
        webix.extend(config, this.ui());

        //TODO pending action
        config.root.middleware.bus.subscribe(kUserActionDone,log(this),kUserActionsChannel);
    },
    defaults:{
        limit: 25,
        type: {
            height: Infinity
        }
    }
}, webix.ui.list, BoundedReverseList);