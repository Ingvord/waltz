// import "webix/webix.css"
// import "webix/skins/mini.css"
// import "!!script-loader!webix/webix.js"

import {WaltzWidget} from "@waltz-controls/middleware";
import newTopToolbar from "views/top_toolbar";
import newBottomToolbar from "views/bottom_toolbar";
import newLeftPanel from "views/left_panel";
import newRightPanel from "views/right_panel";
import newMainView from "views/main_view";
import ScriptingWidget from "widgets/scripting";
import Manager from "widgets/tango/manager";

import RecipeWidget from "./recipe_widget";

export const kMainWindow = 'widget:main';

export default class MainWindow extends WaltzWidget{
    constructor(app) {
        super(kMainWindow, app);

        this.listen(() => {
            $$(this.name).destructor();
        },'logout')
    }

    render() {
        const main = webix.ui({
            id:this.name,
            type: 'space',
            rows: [
                newTopToolbar(this),
                {
                    type:'space',
                    borderless:true,
                    cols: [
                        newLeftPanel(this),
                        {view:'resizer'},
                        {
                            ...newMainView(this),
                            gravity:4
                        },
                        {view:'resizer'},
                        newRightPanel(this)
                    ]
                },
                newBottomToolbar(this)
            ]
        });

        main.attachEvent('logout',()=> {
            this.dispatch({},'logout');
        })

        main.attachEvent('scripting',()=> {
            new ScriptingWidget(this.app)
                .run()
        })

        main.attachEvent('manager',()=> {
            new Manager(this.app)
                .run()
        })

        main.attachEvent('recipe',()=> {
            new RecipeWidget(this.app)
                .run()
        })

        webix.ui.fullScreen();
    }

    run(){
        this.render();
    }

    /**
     *
     * @return {webix.ui.baseview}
     */
    get leftPanel(){
        return $$('left_panel');
    }

    /**
     *
     * @return {webix.ui.baseview}
     */
    get mainView(){
        return $$('main_view');
    }

    /**
     *
     * @return {webix.ui.baseview}
     */
    get rightPanel(){
        return $$('right_panel');
    }

    openTab(id){
        const tab = $$(id) || $$(this.mainView.addView(this.app.getWidget(id).ui()))
        tab.show();
        return tab;
    }
}