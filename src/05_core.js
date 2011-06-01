var WMD = function (options) {
	var opts = this.options = util.extend(true, WMD.defaults, options || {});
	var self = this;
	
	this.panels = {
		toolbar: util.$(opts.toolbar),
		preview: util.$(opts.preview),
		output: util.$(opts.output),
		input: util.$(opts.input)
	};
	
	if (!this.panels.input) throw "WMDEditor: You must define an input textarea for WMD to work on.";

	this.selection = new Selectivizer(this.panels.input);
	

	//IF TOOLBAR EXISTS, POPULATE IT
	if (this.panels.toolbar) {
		//create the toolbar row
		var buttonRow = document.createElement("ul");
			buttonRow.className = "wmd-button-row";
			
			util.addEvent(buttonRow, 'click', function toolbarClickHandler(event, target) {
				var buttonName;
				if (target.tagName === 'LI') {
					buttonName = target.getAttribute('data-button-name');
					if (buttonName) {
						//is a button item and has a defined button name
						WMD.publish('toolbar-button', self, [event, target]); //dispatch a click event for that button
						WMD.publish('toolbar-button:'+buttonName, self, [event, target]);
					}
				}				
				
			});

		this.panels.toolbar.appendChild(buttonRow);
		
		var buttonList = opts.buttons.split(' '),
			buttonNode;
		for (var i=0;i<buttonList.length;i++) {
			var buttonName = buttonList[i],
				buttonObj;
			if (!buttonName) {
				//config string contained a double space, marking a divider
				buttonNode = document.createElement("li");
				buttonNode.className = "wmd-spacer";

				buttonRow.appendChild(buttonNode);
				
			} else if ((buttonObj = WMD._buttons[buttonName])) {
				//button name exists, add button to button bar
				buttonNode = document.createElement("li");
				buttonNode.className = "wmd-button "+buttonObj.className;
				if (buttonObj.title) buttonNode.setAttribute('title', buttonObj.title);
				buttonNode.setAttribute('data-button-name', buttonName);
				
				buttonRow.appendChild(buttonNode);
			}
		
		}
	}

	//IF AN OUTPUT SOURCE IS DEFINED, SETUP THE SHOWDOWN CONVERTER
	if (this.panels.output || this.panels.preview) {
		var converter = new Showdown(opts.markdown);
		var updateOutput = function buildHTMLFromMarkdown() {
			var html = converter.makeHtml(self.panels.input.value);
			
			//write to output field
			if (self.panels.output) {
				// The value property is only defined if the output is a textarea/input.
				// If value is not defined, then we're treating output as a DOMElement
				if (self.panels.output.value !== undefined) {
					self.panels.output.value = html;
				} else {
					self.panels.output.innerHTML = html;
				}
			}

			//write to preview container
			if (self.panels.preview) {
				self.panels.preview.innerHTML = html;
			}
		}
		
		var ip = new InputPoller(self.panels.input, updateOutput, opts.previewPollInterval);
		WMD.subscribe('content-changed', function (chunk) {
			if (this == self) updateOutput();
		});
	}

};

window.WMDEditor = WMD;

WMD.defaults = {
	lineLength: 40,

	button_bar: "wmd-button-bar",
	preview: "wmd-preview",
	output: "wmd-output",
	input: "wmd-input",
	
	markdown: {
		markright: true,
		specialChars: true
	},

	// Some intervals in ms.  These can be adjusted to reduce the control's load.
	previewPollInterval: 500,
	pastePollInterval: 100,

	buttons: "bold italic  link blockquote code image  ol ul heading hr  undo redo help",
	
	autoFormatting: {
		list: true,
		quote: true,
		code: true
	}

};

WMD.prototype = {
	pushUpdate : function (chunk) {
		this.panels.input.value = [chunk.before,chunk.content,chunk.after].join('');
		this.selection.set(chunk);
		WMD.publish('content-changed', this, [chunk]); //dispatch a content change event containing the new chunk
	}
}

WMD.Version = 3.0;
WMD.pluginDebug = false;

WMD._buttons = {};
WMD._shortcutKeys = {};


WMD.registerButton = function (name, options) {
	if (WMD._buttons[name]) throw "WMDEditor: A button named "+name+" is already defined.";
	
	var btn = util.extend({
				className:'wmd-button-'+name,
				titleText:'',
				shortcut:''
			}, options);
	
	WMD._buttons[name] = btn;
	if (btn.shortcut) WMD._shortcutKeys[btn.shortcut] = name;
}

/*

			// Auto-continue lists, code blocks and block quotes when
			// the enter key is pressed.
			util.addEvent(inputBox, "keyup", function (key) {
				if (!key.shiftKey && !key.ctrlKey && !key.metaKey) {
					var keyCode = key.charCode || key.keyCode;
					// Key code 13 is Enter
					if (keyCode === 13) {
						fakeButton = {};
						fakeButton.textOp = command.doAutoindent;
						doClick(fakeButton);
					}
				}
			});

			// Disable ESC clearing the input textarea on IE
			if (util.isIE) {
				util.addEvent(inputBox, "keydown", function (key) {
					var code = key.keyCode;
					// Key code 27 is ESC
					if (code === 27) {
						return false;
					}
				});
			}
		};


*/
