var Supertext = Supertext || {};

Supertext.Util = (function () {
  if (!String.format) {
    String.format = function (format) {
      var args = Array.prototype.slice.call(arguments, 1);
      return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
      });
    };
  }
})();

Supertext.Template = (function (win, doc, $, wp) {
  'use strict';

  var
    /**
     * All template ids
     */
    templateIds = {
      /**
       * The order link row template id
       */
      orderLinkRow: 'sttr-order-link-row',
      /**
       * The order progress bar  template id
       */
      orderProgressBar: 'sttr-order-progress-bar',
      /**
       * The modal template
       */
      modal: 'sttr-modal',
      /**
       * The error template id
       */
      modalError: 'sttr-modal-error',
      /**
       * The button template id
       */
      modalButton: 'sttr-modal-button',
      /**
       * The loader template
       */
      stepLoader: 'sttr-step-loader',
      /**
       * The content step id
       */
      contentStep: 'sttr-content-step',
      /**
       * The item content id
       */
      itemContent: 'sttr-item-content',
      /**
       * The quote step id
       */
      quoteStep: 'sttr-quote-step',
      /**
       * The confirmation step id
       */
      confirmationStep: 'sttr-confirmation-step'
    },
    /**
     * All templates
     */
    templates = {},
    /**
     * return object
     */
    returnObject = {
      initialize: function () {
        $.each(templateIds, function (key, name) {
          returnObject[key] = function (data) {
            return getHtml(name, data);
          };
        });
      }
    };

  function getHtml(templateId, data) {
    if (!templates.hasOwnProperty(templateId)) {
      templates[templateId] = wp.template(templateId);
    }

    return templates[templateId](data);
  }

  return returnObject;
})(window, document, jQuery, wp);

Supertext.Modal = (function (win, doc, $) {
  'use strict';

  var
    /**
     * The selectors of different html elements
     */
    selectors = {
      modal: '#sttr-modal',
      modalBodyContent: '#sttr-modal-body-content',
      modalFullContent: '#sttr-modal-full-content',
      modalFullBodyContent: '#sttr-modal-full-body-content',
      modalNotice: '#sttr-modal-notice',
      modalCloseIcon: '.sttr-modal-icon-close',
      modalBackground: '.sttr-modal-background',
      modalFooter: '.sttr-modal-footer',
      modalNoticeDismissIcon: '.notice-dismiss',
      modalErrorNotice: function (token) {
        return '#sttr-modal-error-' + token;
      },
      modalButton: function (token) {
        return '#sttr-modal-button-' + token;
      }
    },
    /**
     * Template module
     */
    template,
    /**
     * State
     */
    state = {
      /**
       * Notice counter
       * @type {number}
       */
      noticeCounter: 0,
      /**
       * Button counter
       * @type {number}
       */
      buttonCounter: 0,
      /**
       * Close callbacks
       */
      closeCallbacks: [],
      /**
       * Is full screen shown
       */
      isFullScreenShown: false
    };


  /**
   * Opens the modal
   * @param data
   */
  function open(data) {
    var modalHtml = template.modal(data);
    $(doc.body).append(modalHtml);

    state.$modal = $(selectors.modal);
    state.$modal.find(selectors.modalCloseIcon).click(close);
    state.$modal.find(selectors.modalBackground).click(close);
    state.$modal.show();
  }

  /**
   * Closes the modal
   */
  function close() {
    if(state.isFullScreenShown){
      $(selectors.modalFullContent).hide();
      state.isFullScreenShown = false;
      return;
    }

    state.$modal.hide();
    state.$modal.remove();
    $.each(state.closeCallbacks, function (index, callback) {
      callback.call();
    });
  }

  /**
   * Shows some content within the modal
   * @param html
   */
  function showContent(html) {
    $(selectors.modalBodyContent).html(html);
  }

  /**
   * Shows some content in full screen
   * @param html
   */
  function showFullScreenContent(html) {
    $(selectors.modalFullBodyContent).html(html);
    $(selectors.modalFullContent).show();
    state.isFullScreenShown = true;
  }

  /**
   * Shows an error
   * @param error
   * @returns {number} the error token
   */
  function showError(error) {
    var token = ++state.noticeCounter;
    var errorHtml = template.modalError({
      token: token,
      error: error
    });
    state.$modal.find(selectors.modalNotice).append(errorHtml);
    state.$modal.find(selectors.modalNoticeDismissIcon).click(function (e) {
      e.preventDefault();
      hideError(token);
    });
    return token;
  }

  /**
   * Hides an error
   * @param token the error token
   */
  function hideError(token) {
    if (isNaN(token)) {
      $(selectors.modalNotice).empty();
    } else {
      $(selectors.modalErrorNotice(token)).remove();
    }
  }

  /**
   * Adds a button
   * @param innerHtml
   * @param type
   * @param onClickEventHandler
   */
  function addButton(innerHtml, type, onClickEventHandler) {
    var token = ++state.buttonCounter;

    $(selectors.modalFooter).prepend(template.modalButton({
      token: token,
      innerHtml: innerHtml,
      type: type
    }));

    $(selectors.modalButton(token)).click(onClickEventHandler);

    return token;
  }

  /**
   * Removes a button
   * @param token
   */
  function removeButton(token) {
    $(selectors.modalButton(token)).remove();
  }

  /**
   * Enables a button
   * @param token
   */
  function enableButton(token) {
    $(selectors.modalButton(token))
      .removeClass('button-disabled')
      .prop('disabled', false);
  }

  /**
   * Disables a button
   * @param token
   */
  function disableButton(token) {
    $(selectors.modalButton(token))
      .addClass('button-disabled')
      .prop('disabled', true);
  }

  /**
   * Registers close callbacks
   * @param callback
   */
  function onClose(callback) {
    state.closeCallbacks.push(callback);
  }

  return {
    initialize: function (externals) {
      template = externals.template;
    },
    open: open,
    close: close,
    showContent: showContent,
    showFullScreenContent: showFullScreenContent,
    showError: showError,
    hideError: hideError,
    addButton: addButton,
    removeButton: removeButton,
    enableButton: enableButton,
    disableButton: disableButton,
    onClose: onClose
  };
})(window, document, jQuery);

Supertext.Validation = (function ($) {
  'use strict';

  function check(rule) {
    return checkAll([rule]);
  }

  function checkAll(rules) {
    return $.Deferred(function (defer) {
      var errors = [];

      $.each(rules, function (index, rule) {
        rule(function (error) {
          errors.push(error);
        });
      });

      if (errors.length > 0) {
        defer.reject(errors);
        return;
      }

      defer.resolve();
    }).promise();
  }

  return {
    check: check,
    checkAll: checkAll
  };
})(jQuery);

/**
 * Polylang translation plugin to inject translation options
 */
Supertext.Polylang = (function (win, doc, $) {
  'use strict';

  var
    /**
     * Order translation bulk action option value
     * @type {string}
     */
    orderTranslationBulkActionValue = 'orderTranslation',
    /**
     * The selectors of different html elements
     */
    selectors = {
      orderItemList: '.sttr-order-list',
      orderItemRemoveIcon: '.dashicons-no-alt',
      orderItemRemoveButton: '#sttr-order-remove-item',
      orderShowItemContentButton: '#sttr-order-show-item-content',
      orderStep: '#sttr-order-step',
      contentStepForm: '#sttr-content-step-form',
      orderProgressBarSteps: '#sttr-order-progress-bar li',
      orderSourceLanguageInput: '#sttr-order-source-language',
      orderSourceLanguageLabel: '#sttr-order-source-language-label',
      orderTargetLanguageSelect: '#sttr-order-target-language',
      orderTargetLanguageOptions: '#sttr-order-target-language option',
      contentCheckboxes: '.sttr-order-item-details input[type="checkbox"]',
      checkedQuote: 'input[name="translationType"]:checked',
      quoteStepForm: '#sttr-quote-step-form'
    },
    /**
     * Context data containing information about plugin and environment
     */
    context,
    /**
     * Modal module
     */
    modal,
    /**
     * Template module
     */
    template,
    /**
     * Validation module
     */
    validation,
    /**
     * Localization data
     */
    l10n,
    /**
     * Order process steps
     * @type {Array}
     */
    steps = [],
    /**
     * Container for current state data
     */
    state = {
      currentStepNumber: 0
    };

  /**
   * Creates a new step object of specific type
   */
  function createStep(type) {
    return $.extend(new Step(), new type());
  }

  /**
   * Step base constructor
   * @constructor
   */
  function Step() {
    this.savedStepElements = [];
    this.validationRules = {};
    this.nextButtonName = l10n.next;
  }

  /**
   * Step base behaviour
   */
  Step.prototype = {
    load: function () {
      if (this.savedStepElements.length > 0) {
        return this.loadSavedStepElements().done(self.init);
      }

      return this.loadData()
        .done(this.saveData)
        .done(this.addStepElements)
        .done(this.init);
    },
    loadSavedStepElements: function () {
      var self = this;
      return $.Deferred(function (defer) {
        $(selectors.orderStep).empty();
        $(selectors.orderStep).append(self.savedStepElements);
        defer.resolve();
      }).promise();
    },
    loadData: function () {
    },
    saveData: function (data) {
    },
    addStepElements: function (data) {
    },
    init: function () {
    },
    getNextButtonName: function () {
      return this.nextButtonName;
    },
    validate: function () {
      return validation.checkAll(this.validationRules);
    },
    save: function () {
      this.saveForm();
      this.savedStepElements = $(selectors.orderStep).children().detach();
    },
    saveForm: function () {
    }
  };

  /**
   * Content step
   */
  var contentStep = function () {
    var self = this;

    self.validationRules = {
      posts: function (fail) {
        var languageCode = null;
        var isEachPostInSameLanguage = true;
        var isAPostInTranslation = false;
        $.each(state.posts, function (index, post) {
          if (index === 0) {
            languageCode = post.languageCode;
          } else {
            isEachPostInSameLanguage = isEachPostInSameLanguage && post.languageCode == languageCode;
          }

          isAPostInTranslation = isAPostInTranslation || post.meta.inTranslation;
        });

        if (isAPostInTranslation) {
          fail(l10n.errorValidationSomePostInTranslation);
        }

        if (!isEachPostInSameLanguage) {
          fail(l10n.errorValidationNotAllPostInSameLanguage);
        }
      },
      content: function (fail) {
        var anyChecked = false;
        $(selectors.contentCheckboxes).each(function (index, checkbox) {
          if ($(checkbox).prop('checked')) {
            anyChecked = true;
            return false;
          }
        });

        if (anyChecked) {
          return;
        }

        fail(l10n.errorValidationSelectContent);
      },
      targetLanguage: function (fail) {
        if ($(selectors.orderTargetLanguageSelect).val() === '') {
          fail(l10n.errorValidationSelectTargetLanguage);
          return;
        }

        var targetLanguageCode = $(selectors.orderTargetLanguageSelect).val();

        $.each(state.posts, function (index, post) {
          var unfinishedTranslationForTargetLanguage = post.unfinishedTranslations[targetLanguageCode];
          if (unfinishedTranslationForTargetLanguage !== undefined) {
            fail(String.format(l10n.alreadyBeingTranslatedInto, post.title, l10n.languages[targetLanguageCode], unfinishedTranslationForTargetLanguage.orderId));
          }
        });
      }
    };

    /**
     * Loads the content step
     */
    self.loadData = function () {
      return doGetRequest(
        context.ajaxUrl, {
          action: 'sttr_getPostTranslationInfo',
          postIds: state.postIds
        }
      );
    };

    self.saveData = function (data) {
      state.posts = data;
    };

    /**
     * Add the first order step to the modal content
     * @param data
     */
    self.addStepElements = function () {
      $(selectors.orderStep).html(template.contentStep({
        posts: state.posts,
        targetLanguageCode: state.targetLanguageCode,
        languages: l10n.languages
      }));
    };

    /**
     * Initializes step
     */
    self.init = function () {
      initializeOrderItemList();
      checkOrderItems();
    };

    /**
     * Saves content step data
     */
    self.saveForm = function () {
      state.contentFormData = $(selectors.contentStepForm).serializeArray();
    };

    /**
     * Initializes the order item list
     */
    function initializeOrderItemList() {
      var $itemAnchors = $(selectors.orderItemList + ' li a');
      $itemAnchors.click(onOrderItemAnchorClick);
      $itemAnchors.find(selectors.orderItemRemoveIcon).click(onOrderItemRemoveIconClick);
      $(selectors.orderItemRemoveButton).click(onOrderItemRemoveButtonClick);
      $(selectors.orderShowItemContentButton).click(onOrderShowItemContentButtonClick);

      activateOrderItem.call($(selectors.orderItemList + ' li:first a'));
    }

    /**
     * Check order items
     */
    function checkOrderItems() {
      validation
        .check(self.validationRules.posts)
        .fail(showValidationErrors)
        .done(hideValidationError)
        .done(setLanguages);

      if (state.posts.length == 1) {
        $(selectors.orderItemRemoveButton).hide();
      }
    }

    /**
     * Activate order item
     */
    function activateOrderItem() {
      var $clickedItemAnchor = $(this);
      var $activeItemAnchor = $(selectors.orderItemList + ' li.active a');

      if ($activeItemAnchor.length > 0) {
        $($activeItemAnchor.attr('href')).hide();
        $activeItemAnchor.parent().removeClass('active');
      }

      $($clickedItemAnchor.attr('href')).show();
      $clickedItemAnchor.parent().addClass('active');
    }

    /**
     * Order item anchor click event handler
     * @param e
     */
    function onOrderItemAnchorClick(e) {
      e.preventDefault();
      activateOrderItem.call(this);
    }

    /**
     * Order item remove icon click event handler
     * @param e
     */
    function onOrderItemRemoveIconClick(e) {
      e.preventDefault();
      removeOrderItem.call($(this).parent());
    }

    /**
     * Order item remove button click event handler
     * @param e
     */
    function onOrderItemRemoveButtonClick(e) {
      e.preventDefault();
      removeOrderItem.call($(selectors.orderItemList + ' li.active a'));
      activateOrderItem.call($(selectors.orderItemList + ' li:first a'));
    }

    /**
     * Removes an order item
     */
    function removeOrderItem() {
      if (state.posts.length == 1) {
        return;
      }

      var $itemAnchor = $(this);
      $($itemAnchor.attr('href')).remove();
      $itemAnchor.parent().remove();

      var postIdToRemove = $itemAnchor.data('post-id');
      state.posts = state.posts.filter(function (post) {
        return post.id != postIdToRemove;
      });

      checkOrderItems();
    }

    /**
     * Show item content button click event handler
     * @param e
     */
    function onOrderShowItemContentButtonClick(e) {
      e.preventDefault();
      showItemContent.call($(selectors.orderItemList + ' li.active a'));
    }

    /**
     * Show item content
     */
    function showItemContent() {
      var $itemAnchor = $(this);
      var postId = $itemAnchor.data('post-id');

      $.when(
        doGetRequest(
          context.ajaxUrl + '?action=sttr_getPostRawData',
          {postId: postId}
        ),
        doPostRequest(
          context.ajaxUrl + '?action=sttr_getPostContentData&postId='+postId,
          $(selectors.contentStepForm).serializeArray()
        ),
        $.each(state.posts, function (index, post) {
          if(post.id == postId){
            return post;
          }

          return null;
        })
      ).done(function(rawData, contentData, postsResult){

          var preparedContentData = getPreparedContentData(postsResult[0], contentData);

          modal.showFullScreenContent(template.itemContent({
            rawData: JSON.stringify(rawData, null, 4),
            contentData: preparedContentData
          }));
        }
      );
    }

    /**
     * Gets the prepared translation data for the template
     * @param postsResult
     * @param contentData
     * @returns {Array}
     */
    function getPreparedContentData(post, contentData) {
      var preparedContentData = [];

      for (var group in post.translatableFieldGroups) {
        if (!contentData.hasOwnProperty(group)) {
          continue;
        }

        var groupName = post.translatableFieldGroups[group].name;
        var groupElements = [];

        var queue = [{path: group, value: contentData[group]}];

        while (queue.length > 0) {
          var element = queue.pop();

          if (typeof element.value !== 'object' && !(element.value instanceof Array)) {
            groupElements.push(element);
            continue;
          }

          for (var prop in element.value) {
            queue.push({
              path: element.path + "->" + prop,
              value: element.value[prop]
            });
          }
        }

        preparedContentData.push({
          name: groupName,
          elements: groupElements
        });
      }

      return preparedContentData;
    }

    /**
     * Sets the languages to the form
     */
    function setLanguages() {
      var sourceLanguageCode = state.posts[0].languageCode;
      $(selectors.orderSourceLanguageLabel).html(l10n.languages[sourceLanguageCode]);
      $(selectors.orderSourceLanguageInput).val(sourceLanguageCode);

      $(selectors.orderTargetLanguageOptions).each(function (index, option) {
        var $options = $(option);
        if ($options.val() === sourceLanguageCode) {
          $options.remove();
          return;
        }

        $(option).show();
      });
    }
  };

  /**
   * Quote step
   */
  var quoteStep = function () {
    var self = this;

    self.nextButtonName = l10n.orderTranslation;

    self.validationRules = {
      quote: function (fail) {
        if ($(selectors.checkedQuote).length === 0) {
          fail(l10n.errorValidationSelectQuote);
        }
      }
    };

    /**
     * Loads the content step
     */
    self.loadData = function () {
      return doPostRequest(
        context.ajaxUrl + '?action=sttr_getOffer',
        state.contentFormData
      );
    };

    /**
     * Add the first order step to the modal content
     * @param data
     */
    self.addStepElements = function (data) {
      $(selectors.orderStep).html(template.quoteStep({
        wordCount: data.wordCount,
        language: data.language,
        options: data.options
      }));
    };

    /**
     * Saves quote step data
     */
    self.saveForm = function () {
      state.quoteFormData = $(selectors.quoteStepForm).serializeArray();
    };
  };

  /**
   * confirmation step
   */
  var confirmationStep = function () {
    var self = this;

    /**
     * Loads confirmation step
     */
    self.loadData = function () {
      var postData = state.contentFormData.concat(state.quoteFormData);

      return doPostRequest(
        context.ajaxUrl + '?action=sttr_getNewPostQueryParams',
        postData)
        .then(function (createPostsData) {
          var requests = [];
          var autoSaveQueryParam = {};
          autoSaveQueryParam[context.newPostAutoSaveFlag] = 1;

          requests = $.map(createPostsData, function (createPostData) {
            return doGetRequest(context.newPostUrls[createPostData.fromPost][createPostData.newLang], autoSaveQueryParam);
          });

          return $.when.apply($, requests);
        })
        .then(function () {
          return doPostRequest(
            context.ajaxUrl + '?action=sttr_createOrder',
            postData
          );
        });
    };

    /**
     * Adds confirmation step content
     */
    self.addStepElements = function (data) {
      $(selectors.orderStep).html(template.confirmationStep({
        message: data.message
      }));
    };
  };

  /**
   * Sending post changes step
   */
  var sendSyncRequestStep = function () {
    var self = this;

    /**
     * Loads confirmation step
     */
    self.loadData = function () {
      return doGetRequest(
        context.ajaxUrl, {
          action: 'sttr_sendSyncRequest',
          targetPostId: state.targetPostId
        });
    };

    /**
     * Adds confirmation step content
     */
    self.addStepElements = function (data) {
      modal.showContent(template.confirmationStep({
        message: data.message
      }));
    };
  };

  /**
   * Initialize on post screen
   */
  function initializePostScreen() {
    if ($('#post-translations').length == 1) {
      injectOrderLinks();
    }

    if(context.isCurrentPostInTranslation){
      disableTranslatingPost();
    }
  }

  /**
   * Injects an order link for every not yet made translation
   */
  function injectOrderLinks() {
    $('.pll-translation-column').each(function () {
      var languageRow = $(this).parent();
      var languageCode = languageRow
        .find('.pll-translation-column input')
        .first()
        .attr('id')
        .replace('htr_lang_', '');

      languageRow.after(template.orderLinkRow({targetLanguageCode: languageCode}));
    });
  }

  /**
   * Disable a post that is in translation
   */
  function disableTranslatingPost() {
    // Set all default fields to readonly
    $('#post input, #post select, #post textarea').each(function () {
      // If the value contains the in translation text, lock fields
      $(this).attr('readonly', 'readonly');
      $(this).addClass('input-disabled');
    });

    $('#wp-content-wrap').hide();
  }

  /**
   * Initialize on edit screen
   */
  function initializeEditScreen() {
    $('<option>').val(orderTranslationBulkActionValue).text(l10n.offerTranslation).appendTo("select[name='action']");
    $('<option>').val(orderTranslationBulkActionValue).text(l10n.offerTranslation).appendTo("select[name='action2']");

    $('#doaction, #doaction2').click(onBulkActionApply);
  }

  /**
   * Handles click on apply button of bulk actions
   * @param e
   * @returns {boolean}
   */
  function onBulkActionApply(e) {
    var selectName = $(this).attr('id').substr(2);
    if ($('select[name="' + selectName + '"]').val() !== orderTranslationBulkActionValue) {
      return true;
    }

    e.preventDefault();

    var postIds = [];
    $('input[name="post[]"]:checked').each(function () {
      postIds.push($(this).val());
    });

    $('input[name="media[]"]:checked').each(function () {
      postIds.push($(this).val());
    });

    if (postIds.length > 0) {
      state.postIds = postIds;
      startOrderProcess();
    } else {
      alert(l10n.alertPleaseSelect);
    }

    return false;
  }

  /**
   * Starts the order process
   */
  function startOrderProcess() {
    steps = [createStep(contentStep), createStep(quoteStep), createStep(confirmationStep)];
    openModal(l10n.orderModalTitle);
    addOrderProgressBar();
    addCancelButton();
    addBackButton();
    loadStep(1);
  }

  /**
   * Starts the send post changes process
   */
  function startSendSyncRequestProcess() {
    var step = createStep(sendSyncRequestStep);
    openModal(l10n.sendChangesModalTitle);
    addCloseButton();
    modal.showContent(template.stepLoader({}));

    step.load();
  }

  /**
   * Opens the modal
   */
  function openModal(title) {
    modal.open({
      title: title
    });
  }

  /**
   * Adds the order progress bar
   */
  function addOrderProgressBar() {
    modal.showContent(template.orderProgressBar({}));
  }

  /**
   * Adds the cancel button
   */
  function addCancelButton() {
    state.cancelButtonToken = modal.addButton(
      l10n.cancel,
      'secondary',
      function () {
        modal.close();
      }
    );
  }

  /**
   * Adds the close button
   */
  function addCloseButton() {
    modal.addButton(
      l10n.close,
      'secondary',
      function () {
        modal.close();
      }
    );

    modal.onClose(function () {
      win.location.reload();
    });
  }

  /**
   * Adds the buttons
   */
  function addBackButton() {
    state.backButtonToken = modal.addButton(
      l10n.back,
      'secondary',
      moveToPreviousStep
    );
  }

  /**
   * Moves to next step
   */
  function moveToNextStep() {
    steps[state.currentStepNumber - 1].validate()
      .fail(showValidationErrors)
      .done(hideValidationError)
      .done(function () {
        steps[state.currentStepNumber - 1].save();
        loadStep(state.currentStepNumber + 1);
      });
  }

  /**
   * Moves to previous step
   */
  function moveToPreviousStep() {
    hideValidationError();
    hideAjaxResponseError();
    hideAjaxError();
    loadStep(state.currentStepNumber - 1);
  }

  /**
   * Loads a step
   * @param stepNumber
   */
  function loadStep(stepNumber) {
    updateButtonsInLoadingState(stepNumber);
    updateOrderProgressBar(stepNumber);
    addStepLoader();

    steps[stepNumber - 1]
      .load()
      .done(function (){
        removeNextButton();
        addNextButton(stepNumber);
      })
      .fail(function(){
        removeNextButton();
      })
      .always(function () {
        updateButtonsInLoadedState(stepNumber);
      });

    state.currentStepNumber = stepNumber;
  }

  /**
   * Updates the step button states according to step number and amount steps
   * @param stepNumber
   */
  function updateButtonsInLoadingState() {
    modal.disableButton(state.nextButtonToken);
    modal.disableButton(state.backButtonToken);
    modal.disableButton(state.cancelButtonToken);
  }

  /**
   * Updates the next button
   * @param stepNumber
   */
  function addNextButton(stepNumber) {
    state.nextButtonToken = modal.addButton(
      steps[stepNumber - 1].getNextButtonName(),
      'primary',
      moveToNextStep
    );
  }

  /**
   * Removes the next button
   */
  function removeNextButton(){
    if (state.nextButtonToken) {
      modal.removeButton(state.nextButtonToken);
    }
  }

  /**
   * Updates the step button states according to step number and amount steps
   * @param stepNumber
   */
  function updateButtonsInLoadedState(stepNumber) {
    if (stepNumber == steps.length) {
      modal.removeButton(state.nextButtonToken);
      modal.removeButton(state.backButtonToken);
      modal.removeButton(state.cancelButtonToken);
      addCloseButton();
      return;
    }

    if (stepNumber < steps.length) {
      modal.enableButton(state.nextButtonToken);
    }

    if (stepNumber > 1) {
      modal.enableButton(state.backButtonToken);
    }

    modal.enableButton(state.cancelButtonToken);
  }

  /**
   * Adds the step loader
   */
  function addStepLoader() {
    $(selectors.orderStep).html(template.stepLoader({}));
  }

  /**
   * Updates the order progress bar
   * @param stepNumber
   */
  function updateOrderProgressBar(stepNumber) {
    $(selectors.orderProgressBarSteps).each(function (index, step) {
      if (index == stepNumber - 1) {
        $(step).addClass('active');
        return;
      }
      $(step).removeClass('active');
    });
  }

  /**
   * Shows validation errors
   * @param errors string[]
   */
  function showValidationErrors(errors) {
    if (state.validationErrorToken) {
      hideValidationError();
    }

    state.validationErrorToken = modal.showError({
      title: l10n.validationError,
      message: errors
    });
  }

  /**
   * Hides the validation errors
   */
  function hideValidationError() {
    if (!state.validationErrorToken) {
      return;
    }

    modal.hideError(state.validationErrorToken);
    state.validationErrorToken = null;
  }

  /**
   * Does post request
   * @param url
   * @param data
   * @returns {*}
   */
  function doGetRequest(url, data) {
    return $.Deferred(function (defer) {
      $.get(
        url,
        data
      ).done(
        function (responseData) {
          defer.resolve(responseData);
        }
      ).fail(
        showAjaxError
      ).fail(
        defer.reject
      );
    }).promise();
  }

  /**
   * Does post request
   * @param url
   * @param data
   * @returns {*}
   */
  function doPostRequest(url, data) {
    return $.Deferred(function (defer) {
      $.post(
        url,
        data
      ).done(
        function (responseData) {
          defer.resolve(responseData);
        }
      ).fail(
        showAjaxError
      ).fail(
        defer.reject
      );
    }).promise();
  }

  /**
   * Hides an ajax response error
   */
  function hideAjaxResponseError(){
    if(!state.ajaxResponseErrorToken){
      return;
    }

    modal.hideError(state.ajaxResponseErrorToken);
    state.ajaxResponseErrorToken = null;
  }

  /**
   * Shows an ajax error
   * @param jqXHR
   * @param textStatus
   * @param errorThrown
   */
  function showAjaxError(jqXHR, textStatus, errorThrown) {
    state.ajaxErrorToken = modal.showError({
      title: l10n.networkError,
      message: jqXHR.status + ' ' + textStatus + ': ' + errorThrown,
      details: jqXHR.responseJSON
    });
  }

  /**
   * Hides an ajax error
   */
  function hideAjaxError(){
    if(!state.ajaxErrorToken){
      return;
    }

    modal.hideError(state.ajaxErrorToken);
    state.ajaxErrorToken = null;
  }

  /**
   * Opens the order form in a thickbox
   * @param targetLanguageCode
   */
  function openOrderForm(targetLanguageCode) {
    if (hasUnsavedChanges() && !confirm(l10n.confirmUnsavedPost)) {
      return;
    }

    state.postIds = [context.currentPostId];
    state.targetLanguageCode = targetLanguageCode;

    startOrderProcess();
  }

  /**
   * Sends the post changes to supertext
   */
  function sendSyncRequest() {
    state.targetPostId = context.currentPostId;

    startSendSyncRequestProcess();
  }

  /**
   * Checks if tinymce or title have unsaved changes
   * @returns {boolean} true, if there are changes
   */
  function hasUnsavedChanges() {
    var bHasUnsavedChanges = false;
    var mce = typeof(tinyMCE) != 'undefined' ? tinyMCE.activeEditor : false, title, content;

    if (mce && !mce.isHidden()) {
      if (mce.isDirty())
        bHasUnsavedChanges = true;
    } else {
      if (typeof(fullscreen) !== 'undefined' && fullscreen.settings.visible) {
        title = $('#wp-fullscreen-title').val();
        content = $("#wp_mce_fullscreen").val();
      } else {
        title = $('#post #title').val();
        content = $('#post #content').val();
      }

      if (typeof(autosaveLast) !== 'undefined') {
        if ((title || content) && title + content != autosaveLast) {
          bHasUnsavedChanges = true;
        }
      }
    }
    return bHasUnsavedChanges;
  }

  return {
    /**
     * Loading the module
     */
    initialize: function (externals) {
      context = externals.context;
      modal = externals.modal;
      template = externals.template;
      validation = externals.validation;
      l10n = externals.l10n;

      if (!context.enable) {
        return;
      }

      if (context.screen == 'post') {
        initializePostScreen();
      } else if (context.screen == 'edit' || context.screen == 'upload') {
        initializeEditScreen();
      }
    },
    openOrderForm: openOrderForm,
    sendSyncRequest: sendSyncRequest
  };

})(window, document, jQuery);

// Load on load. yass.
jQuery(document).ready(function () {
  Supertext.Template.initialize();

  Supertext.Modal.initialize({
    template: Supertext.Template
  });

  Supertext.Polylang.initialize({
    context: Supertext.Context || {
      enable: false
    },
    modal: Supertext.Modal,
    template: Supertext.Template,
    validation: Supertext.Validation,
    l10n: supertextTranslationL10n
  });
});
