$.fn.customFileInput = function() {
	// apply events and styles for file input element
	var fileInput = $(this)
	.focus(function() {
		upload.addClass('ui-state-focus');
		uploadButton.addClass('ui-state-focus');
		fileInput.data('val', fileInput.val());
      $("#uploadMessages").hide();
	})
	.blur(function() {
		upload.removeClass('ui-state-focus');
		uploadButton.removeClass('ui-state-focus');
		$(this).trigger('checkChange');
	})
	.bind('disable', function() {
		fileInput.attr('disabled', true);
		upload.addClass('ui-state-disabled');
	})
	.bind('enable', function() {
		fileInput.removeAttr('disabled');
		upload.removeClass('ui-state-disabled');
	})
	.bind('checkChange', function() {
      	if (fileInput.val() && fileInput.val() != fileInput.data('val')) {
			fileInput.trigger('change');
	}
	})
	.bind('change', function() {
		// get file name

		var fileName = $(this).val().split(/\\/).pop();
		// update the feedback
		uploadFeedback.text(fileName) // set feedback text to filename
		              .removeClass('ui-state-disabled');

		return true;
	})
	.click(function() { // for IE and Opera, make sure change fires after choosing a file, using an async callback
		fileInput.data('val', fileInput.val());
		setTimeout(function() {
			fileInput.trigger('checkChange');
		}, 100);

	});
	
	var width = Math.max(fileInput.width(), 369);
	var height = Math.max(fileInput.height(), 27);
	
	// create custom control container
	var upload = $('<span class="file-wrapper ui-widget ui-widget-content ui-corner-all"></span>')
		.mouseover(function() {
			upload.addClass('ui-state-hover');
			uploadButton.addClass('ui-state-hover');
		})
		.mouseout(function() {
			upload.removeClass('ui-state-hover');
			uploadButton.removeClass('ui-state-hover');
		})
		.width(width)
		.height(height);
    var uploadFeedback = $('<span class="feedback ui-state-disabled" aria-hidden="true">' + $.i18n.prop("no_file_selected") + '</span>')
			.appendTo(upload);
	var uploadButton = $('<span class="folder"><img src="images/Documents-icon.png" /> </span>')
			.appendTo(upload);

	// match disabled state
	if (fileInput.is('[disabled]')) {
		fileInput.trigger('disable');
	}

	// insert
	upload.insertAfter(fileInput);
	fileInput.appendTo(upload);

	// return jQuery
	return $(this);
};
