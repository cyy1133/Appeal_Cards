class Appeal_Card_Menu{
    static ID = 'Appeal_Cards';

    static FLAGS = {
        APPEAL_CARD_MENU: 'appeal_card_menu'
    }

    static TEMPLATES = {
        Appeal_Card_Menu: 'modules/Appeal_Cards/templates/Appeal_Card.hbs'
    }

    static SETTINGS = {
      INJECT_BUTTON: 'inject-button'
    }

    static initialize() {
        this.AppealListConfig = new AppealListConfig();
      }

    static log(force, ...args) {  
        const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);
    
        if (shouldLog) {
          console.log(this.ID, '|', ...args);
        }
      }
}

class AppealListData {
    static get allAppeals() {
      const allAppeals = game.users.reduce((accumulator, user) => {
        const userAppeals = this.getAppealsForUser(user.id);
  
        return {
          ...accumulator,
          ...userAppeals
        }
      }, {});
  
      return allAppeals;
    }
  
    static getAppealsForUser(userId) {
      return  game.users.get(userId)?.getFlag(Appeal_Card_Menu.ID, Appeal_Card_Menu.FLAGS.APPEAL_CARD_MENU);
    }
  
    static createAppeal(userId, AppealData) {
      const newAppeal = {
        isDone: false,
        label: '',
        desc:'',
        ...AppealData,
        id: foundry.utils.randomID(16),
        userId,
      }

      const newAppeals = {
        [newAppeal.id]: newAppeal
      }
  
      return game.users.get(userId)?.setFlag(Appeal_Card_Menu.ID, Appeal_Card_Menu.FLAGS.APPEAL_CARD_MENU, newAppeals);
    }

    static updateAppeal(AppealId, updateData) 
    {
      const relevantAppeal = this.allAppeals[AppealId];
  
      // construct the update to send
      const update = {
        [AppealId]: updateData
      }
  
      return game.users.get(relevantAppeal.userId)?.setFlag(Appeal_Card_Menu.ID, Appeal_Card_Menu.FLAGS.APPEAL_CARD_MENU, update);
  
    }
  
    static deleteAppeal(AppealId) 
    {
      const relevantAppeal = this.allAppeals[AppealId];
  
      // Foundry specific syntax required to delete a key from a persisted object in the database
      const keyDeletion = {
        [`-=${AppealId}`]: null
      }
  
      return game.users.get(relevantAppeal.userId)?.setFlag(Appeal_Card_Menu.ID, Appeal_Card_Menu.FLAGS.APPEAL_CARD_MENU, keyDeletion);
   
    }
  
    static updateUserAppeal(userId, updateData) {
      return game.users.get(userId)?.setFlag(Appeal_Card_Menu.ID, Appeal_Card_Menu.FLAGS.APPEAL_CARD_MENU, updateData);
    }
  }


  class AppealListConfig extends FormApplication {
    static get defaultOptions() {
      const defaults = super.defaultOptions;
    
      const overrides = {
        closeOnSubmit: false,
        submitOnChange: true,
        id: 'appeal-list',
        
        template: Appeal_Card_Menu.TEMPLATES.Appeal_Card_Menu,
        title: 'Appeal List',
        popOut: true,
        resizable: true,
        userId: game.userId,
      };
    
      const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
      
      return mergedOptions;
    }
  
    getData(options) {
      return {
        appeals : AppealListData.getAppealsForUser(options.userId)
      }
    }

    async _updateObject(event, formData) {
        const expandedData = foundry.utils.expandObject(formData);
    
        await AppealListData.updateUserAppeal(this.options.userId, expandedData);
      }


    async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;
    const AppealId = clickedElement.parents('[data-id]')?.data()?.id;

    switch (action) {
        case 'create': {
        await AppealListData.createAppeal(this.options.userId);
        this.render();
        break;
        }

        case 'delete': {
        await AppealListData.deleteAppeal(AppealId);
        this.render();
        break;
        }

        default:
        Appeal_Card_Menu.log(false, 'Invalid action detected', action);
    }
    }

    activateListeners(html) {
    super.activateListeners(html);

    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    }
  }

/**
 * Register our module's debug flag with developer mode's custom hook
 */
 Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(Appeal_Card_Menu.ID);
  });

  Hooks.on('renderPlayerList', (playerList, html) => {

    game.users.forEach(function(playerId)
    {
      // find the element which has our logged in user's id
      const loggedInUserListItem = html.find(`[data-user-id="${playerId.data._id}"]`)
    
      // create localized tooltip
      const tooltip = game.i18n.localize('TODO-LIST.button-title');
    
      // insert a button at the end of this element
      loggedInUserListItem.append(
        `<button type='button' class='todo-list-icon-button flex0' title="${tooltip}">
          <i class='fas fa-tasks'></i>
        </button>`
      );
    
      // register an event listener for this button
      html.on('click', '.todo-list-icon-button', (event) => {
        const userId = $(event.currentTarget).parents('[data-user-id]')?.data()?.userId;

        Appeal_Card_Menu.AppealListConfig.render(true, {userId});
      });
    });
  });

  /**
 * Once the game has initialized, set up our module
 */
Hooks.once('init', () => {
    Appeal_Card_Menu.initialize();
  });