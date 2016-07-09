var Supertext = Supertext || {};

Supertext.Settings = {};

//Users tab module
Supertext.Settings.Users = (function ($) {
  'use strict';

  var $tableBody,
    $rowTemplate;

  function addUserField() {
    var $newRow = $rowTemplate.clone();
    $newRow.find('.remove-user-button').click(removeUserField);
    $tableBody.append($newRow);
  }

  function removeUserField() {
    $(this).parent('td').parent('tr').remove();

    if ($tableBody.find('tr').length === 0) {
      addUserField();
    }
  }

  return {
    initialize: function (options) {
      options = options || {};

      $tableBody = $("#tblStFields tbody")
      $tableBody.find('tr .saved-user-id-hidden')
      $tableBody.find('tr .remove-user-button').click(removeUserField);
      //select users in wp dropdown
      $tableBody.find('tr .saved-user-id-hidden').each(function () {
        var $this = $(this);
        $this.prev().val($this.val());
      });

      $rowTemplate = $('#tblStFields tr:last').clone();
      $rowTemplate.find('input').val('');

      $('#btnAddUser').click(addUserField);
    }
  }
})(jQuery);

//Custom Fields tab module
Supertext.Settings.TranslatableFields = (function ($) {
  'use strict';
  var customFieldsSettings = (function () {
    var $customFieldInputCopy;

    function addCustomFieldInput() {
      var $this = $(this);
      var $newCustomFieldInput = $customFieldInputCopy.clone();

      $newCustomFieldInput.children('.custom-field-remove-input')
        .click(removeCustomFieldInput);

      $newCustomFieldInput.insertBefore($this).show();
    }

    function removeCustomFieldInput() {
      $(this).parent().remove();
    }

    return {
      initialize: function (options) {

        $customFieldInputCopy = $('#translatablefieldsSettingsForm .custom-field-input').last().clone();

        $('#translatablefieldsSettingsForm .custom-field-remove-input')
          .click(removeCustomFieldInput);

        $('#translatablefieldsSettingsForm .custom-field-add-input')
          .click(addCustomFieldInput);
      }
    }

  }());

  var pcfSettings = (function () {
    var $pcfFieldsTree,
      $checkedPcfFieldsInput;

    function setCheckedPcfFields() {
      var checkedNodes = $pcfFieldsTree.jstree("get_checked", false);
      $checkedPcfFieldsInput.val(checkedNodes.join(','));
    }

    return {
      initialize: function (options) {
        options = options || {};

        $pcfFieldsTree = $('#pcfFieldsTree');

        if($pcfFieldsTree.length == 0){
          return;
        }

        $checkedPcfFieldsInput = $('#checkedPcfFieldsInput');

        $pcfFieldsTree
          .jstree({
            'core': {
              'themes': {
                'name': 'wordpress-dark'
              }
            },
            'plugins': ['checkbox'],
            'checkbox': {
              'keep_selected_style': false
            }
          });

        $pcfFieldsTree.jstree('select_node', savedPcfFields);

        $('#translatablefieldsSettingsForm').submit(setCheckedPcfFields);
      }
    }
  }());

  var acfSettings = (function () {
    var $acfFieldsTree,
      $checkedAcfFieldsInput;

    function setCheckedAcfFields() {
      var checkedNodes = $acfFieldsTree.jstree("get_checked", false);
      $checkedAcfFieldsInput.val(checkedNodes.join(','));
    }

    return {
      initialize: function (options) {
        options = options || {};

        $acfFieldsTree = $('#acfFieldsTree');

        if($acfFieldsTree.length == 0){
          return;
        }

        $checkedAcfFieldsInput = $('#checkedAcfFieldsInput');

        $acfFieldsTree
          .jstree({
            'core': {
              'themes': {
                'name': 'wordpress-dark'
              }
            },
            'plugins': ['checkbox'],
            'checkbox': {
              'keep_selected_style': false
            }
          });

        $acfFieldsTree.jstree('select_node', savedAcfFields);

        $('#translatablefieldsSettingsForm').submit(setCheckedAcfFields);
      }
    }
  }());

  return {
    initialize: function (options) {
      options = options || {};

      customFieldsSettings.initialize(options);
      pcfSettings.initialize(options);
      acfSettings.initialize(options);
    }
  }
})(jQuery);

//Shortcodes tab module
Supertext.Settings.Shortcodes = (function ($) {
  'use strict';

  var availableEncodingFunctions = [
    "rawurl",
    "url",
    "base64"
  ];

  function addAttributeInput() {
    var $this = $(this);
    var attributeInputCopy = $($this.prev().clone());
    var oldIndex = $this.prev().data('index');
    var newIndex = oldIndex + 1;

    attributeInputCopy.data('index', newIndex);
    attributeInputCopy.attr('data-index', newIndex);

    attributeInputCopy.children('input[type=text]').each(function () {
      var $this = $(this);
      $this.val('');
      var name = $(this).attr('name').replace('[attributes][' + oldIndex + ']', '[attributes][' + newIndex + ']');
      $this.attr('name', name);
    });

    attributeInputCopy.children('.shortcode-attribute-remove-input')
      .click(removeAttributeInput);

    attributeInputCopy.insertBefore($this).show();
  }

  function removeAttributeInput() {
    $(this).parent().remove();
  }

  function showNotEmptyAttributeInputs() {
    $('#shortcodesSettingsForm .shortcode-attribute-input input[type=text]').each(function () {
      var $this = $(this);
      if ($this.val() != '') {
        $this.parent().show();
      }
    });
  }

  function split(val) {
    return val.split(/,\s*/);
  }

  function extractLast(term) {
    return split(term).pop();
  }

  return {
    initialize: function (options) {
      options = options || {};

      showNotEmptyAttributeInputs();

      $('#shortcodesSettingsForm .shortcode-attribute-add-input')
        .click(addAttributeInput);

      $('#shortcodesSettingsForm .shortcode-attribute-remove-input')
        .click(removeAttributeInput);

      $('.shortcode-input-encoding')
        .bind("keydown", function (event) {
          if (event.keyCode === $.ui.keyCode.TAB &&
            $(this).autocomplete("instance").menu.active) {
            event.preventDefault();
          }
        })
        .autocomplete({
          minLength: 0,
          source: function (request, response) {
            // delegate back to autocomplete, but extract the last term
            response($.ui.autocomplete.filter(
              availableEncodingFunctions, extractLast(request.term)));
          },
          focus: function () {
            // prevent value inserted on focus
            return false;
          },
          select: function (event, ui) {
            var terms = split(this.value);
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push(ui.item.value);
            // add placeholder to get the comma-and-space at the end
            terms.push("");
            this.value = terms.join(", ");
            return false;
          }
        }
      );
    }
  }
})(jQuery);


jQuery(document).ready(function () {
  //get active tab
  var queryString = window.location.search;
  var tab = /tab=(.*?)(&|$|\s)/.exec(queryString);
  var tabName = tab === null ? 'users' : tab[1];

  //initialize tab module
  switch (tabName) {
    case 'users':
      Supertext.Settings.Users.initialize();
      break;

    case 'translatablefields':
      Supertext.Settings.TranslatableFields.initialize();
      break;

    case 'shortcodes':
      Supertext.Settings.Shortcodes.initialize();
      break;
  }
});