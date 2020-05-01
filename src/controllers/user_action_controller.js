import {Controller} from "@waltz-controls/middleware";
import {ExecuteTangoCommand, ReadTangoPipe, UserAction} from "models/user_action";
import {kTangoRestContext} from "controllers/tango_rest";
import {kChannelTango} from "models/tango";

export const kControllerUserAction = 'controller:user_action';
const kUserActionsChannel = "channel:user-actions";
const kUserActionSubmit = "user-action:submit";
const kUserActionDone = "user-action:done";
export default class UserActionController extends Controller {
    constructor() {
        super(kControllerUserAction);
    }

    config(){
        this.listen((action, event) => {
            UserActionService.create(action, this.app.context, this.app.middleware.bus).execute();
        },kUserActionSubmit,kUserActionsChannel);
    }

    /**
     *
     * @param {typeof UserAction} action
     * @return {Promise<*>}
     */
    submit(action) {
        this.dispatch(action, kUserActionSubmit, kUserActionsChannel);
        const channel = action.target === "tango" ? kChannelTango : kControllerUserAction;
        const topic = action.action;


            const outerAction = action;
            return new Promise((resolve, reject) => {
                const listener = (action) => {
                    const timeout = setTimeout(() => {
                        this.middleware.bus.unsubscribe(kUserActionDone, listener, kUserActionsChannel);
                        reject({
                            errors: [new Error(`UserAction[id=${this.id};action=${this.action};target=${this.target}] has failed due to 3s timeout`)]
                        });
                    }, 3000);

                    if(action.id === outerAction.id){
                        clearTimeout(timeout);
                        this.middleware.bus.unsubscribe(kUserActionDone, listener, kUserActionsChannel);
                        if(action.hasFailed()){
                            reject(action);
                        } else {
                            resolve(action);
                        }
                    }
                };

                this.middleware.bus.subscribe(kUserActionDone,listener, kUserActionsChannel)
            })
                .then(action => {
                    this.dispatch(action,topic,channel)
                    return action.data;
                })
                .catch(action => {
                    this.dispatchError(action,topic,channel)
                    throw action.data;
                });
    }
}

/**
 * Executes and logs corresponding user action
 *
 * @example
 * UserAction.writeAttribute(attr, value)
 *                               .then(function(){
 *                                    alert(":)");
 *                               })
 *
 * @author Igor Khokhriakov <igor.khokhriakov@hzg.de>
 * @since 4/24/18
 * @class
 * @type {UserAction}
 * @property {number} id
 * @property {string} type
 * @property {string} value
 * @property {number} timestamp
 * @extends MVC.Model
 * @memberof TangoWebappPlatform
 */
class UserActionService {
    constructor(action, context, eventbus){
        this.action = action;
        this.context = context;
        this.eventbus = eventbus;
    }

    static create(action, context, eventbus){
        switch(action.target){
            case "script":
                return new ScriptExecutionService(action, context, eventbus);
            case "tango":
                return new TangoUserActionExecutionService(action, context, eventbus);
        }
    }

    execute(){
        throw new Error("Not implemented!");
    }

    publishResult(result){
        this.eventbus.publish(kUserActionDone,result,kUserActionsChannel);
    }
}

function setData(action, data){
    action.data = data;
    return action;
}

class ScriptExecutionService extends UserActionService {
    constructor(action, context, eventbus) {
        super(action, context, eventbus);
    }

    execute() {
        this.action.data.execute(this.context).then(script => {
            this.publishResult(setData(this.action,script));
        }).catch(script => {
            this.publishResult(setData(this.action,script));
        });
    }
}

class TangoUserActionExecutionService extends UserActionService {
    constructor(action, context, eventbus) {
        super(action, context, eventbus);
    }

    async execute() {
        const rest = await this.context.get(kTangoRestContext);
        switch(this.action.action){
            case ReadTangoPipe.action:
                rest.newTangoPipe(this.action.tango_id)
                    .read()
                    .toPromise()
                    .then((result)=>{
                        this.publishResult(setData(this.action,result));
                    }).catch(result=> {
                        this.publishResult(setData(this.action,result));
                    });
                return;
            case "read":
                rest.newTangoAttribute(this.action.tango_id).read()
                    .toPromise()
                    .then((result)=>{
                        this.publishResult(setData(this.action,result));
                    }).catch(result=> {
                        this.publishResult(setData(this.action,result));
                    });
                return;
            case "write":
                rest.newTangoAttribute(this.action.tango_id)
                    .write(this.action.value)
                    .toPromise()
                    .then((result)=>{
                        this.publishResult(setData(this.action,result));
                    }).catch(result=> {
                        this.publishResult(setData(this.action,result));
                    });
                return;
            case ExecuteTangoCommand.action:
                rest.newTangoCommand(this.action.tango_id).execute(this.action.value)
                    .toPromise()
                    .then((result)=>{
                        this.publishResult(setData(this.action,{
                            ...result,
                            input:this.action.value
                        }));
                    }).catch(result=> {
                    this.publishResult(setData(this.action,result));
                });
                return;
            case "alias":
                if(this.action.remove){
                    this.action.device.deleteAlias().then((result)=>{
                        this.publishResult(setData(this.action,result));
                    }).fail(result=> {
                        this.publishResult(setData(this.action,result));
                    });
                } else {
                    this.action.device.updateAlias(this.action.alias).then((result)=>{
                        this.publishResult(setData(this.action,result));
                    }).fail(result=> {
                        this.publishResult(setData(this.action,result));
                    });
                }
                return;
        }
    }
}
