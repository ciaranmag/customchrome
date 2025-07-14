function template(entry) {
	return `
	<div class="extBlock${entry.isApp ? ' app' : ''}">
	<div class="lefty">
	 	<div class="picHolder">
	 		<img src="${entry.pic}">
	 	</div>
	 	<div class="nameDesc">
			<span class="extName">${entry.name}</span>
			${entry.disabledReason === "permissions_increase" ? '<span style="color:red">(needs more permissions)</span>' : ''}
			${entry.development ? '<span class="development-badge tooltipped" data-tooltip="Development">D</span>' : ''}
			${entry.isApp ? '<span class="new badge"></span>' : ''}
			<br>
		 	${!user.compactStyles ? `<span class="extDescription">${entry.description}</span>`: ''}
		</div>
	</div>

	<div class="righty">
		<div class="switch ext-switch" id="${entry.id}" name="${entry.name}">
			<label>
				<input type="checkbox" ${entry.stringEnabled} class="js-switch state-switch" tabindex="1">
				<span class="lever"></span>
			</label>
			<a class='btn-flat show-ext-links togdrop' href='#'><i class="material-icons">arrow_drop_down</i></a>
			<a class='btn-flat hide-ext-links' href='#'><i class="material-icons">arrow_drop_up</i></a>
		</div>
	</div>

	<div class="container ext-links">
			<div class="row description">
				<span>${entry.description}</span>
			</div>
			<div class="row buttons" data-extId="${entry.id}">
				${entry.homepageUrl ? `<div class="link"><a href="${entry.homepageUrl}" target="_blank"><i class="material-icons">home</i>Homepage</a></div>` : ''}
				${entry.optionsUrl ? `<div class="link options-link" data-link="${entry.optionsUrl}"><a href=""><i class="material-icons">settings</i>Options</a></div>` : ''}
				<div class="link"><a href="#!" class="uninstallExt"><i class="material-icons">delete</i>Uninstall</a></div>
			</div>
	</div>
</div>`;
}

function extListTemplate(ext) {
	return `
	<div class='extList-holder'>
		<div class='extList-toggle'>
			<input type="checkbox"	id="${ext.name}" appid=${ext.id}>
			<label for="${ext.name}"></label>
		</div>
		<div class='extList-img'>
			<img src='${ext.pic}'>
		</div>
		<div class='extList-name'>
			<span>${ext.name}</span>
			${ext.development ? '<span class="development-badge tooltipped" data-tooltip="Development">D</span>' : ''}
			${ext.isApp ? '<span class="new badge"></span>' : ''}
		</div>
	</div>`;
}

function groupListTemplate(group) {
	return `
	<div class='groupList-holder' group="${group}">
		<div class='groupList-name'>
			<span>${group}</span>
		</div>
		<button class="btn waves-effect waves-light grey edit">EDIT</button>
		<button class="btn waves-effect waves-light red delete">DELETE</button>
	</div>`;
}

function popupMessage(message, btnText) {
	return `
	<div id="popupMessage" class="modal">
		<div class="modal-content">
			<p>${message}</p>
		</div>
		<div class="modal-footer">
			<a href="#!" class="modal-action modal-close waves-effect waves-green btn-flat">${btnText}</a>
		</div>
	</div>`;
}


