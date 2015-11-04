import text from './text';

export default function browserTypeset({ id, text, measureText }) {

	const browserElement = document.getElementById(id);
	const width = browserElement.offsetWidth;

	// wrap each word in a <span> element and insert them into the DOM
	const words = text.split(/\s/);
	const wordsFragment = document.createDocumentFragment();
	words.forEach(word => {
		const span = document.createElement('span');
		span.appendChild(document.createTextNode(word));
		wordsFragment.appendChild(span);
		wordsFragment.appendChild(document.createTextNode(' '));
	});
	browserElement.appendChild(wordsFragment);

	// iterate each <span>, binning the nodes into lines.
	const lines = [{ offsetTop: browserElement.childNodes[0].offsetTop, nodes: [] }];
	for (let node of browserElement.childNodes) {
		const previous = lines[lines.length - 1];
		if (node.nodeType === Node.TEXT_NODE) {
			// accumulate textnodes indiscriminantly; we will clean them
			// when we finish building the line.
			previous.nodes.push(node);
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			// only element nodes have an offsetTop property. inspect it to
			// see if we're on the same line as before
			if (node.offsetTop === previous.offsetTop) { // same line?
				previous.nodes.push(node); // append to previous.
			} else { // new line?
				// clean trailing spaces from the previous line
				while (previous.nodes[previous.nodes.length - 1].nodeType === Node.TEXT_NODE) {
					previous.nodes.pop();
				}
				// record a new line.
				lines.push({ offsetTop: node.offsetTop, nodes: [node] });
			}
		}
	}

	const spaceWidth = measureText('\u{00A0}');

	// sum up the width of and number of spaces on each line
	const lineWidths = lines.map( ({ nodes }) => {
		const spaces = nodes
			.filter(node => node.nodeType === node.TEXT_NODE)
			.length;
		const lineWidth = spaces * spaceWidth + nodes
			.filter(node => node.nodeType === node.ELEMENT_NODE)
			.map(node => measureText(node.childNodes[0].nodeValue))
			.reduce((sum, width) => sum + width, 0);
		return { lineWidth, spaces };
	});

	// This works under the assumption that a space is 1/3 of an em, and 
	// the stretch value is 1/6. Although the actual browser value may be
	// different, the assumption is valid as it is only used to compare
	// to the ratios calculated earlier.
	const stretchWidth = spaceWidth * (3 / 6);
	const shrinkWidth = spaceWidth * (3 / 9);

	const ratios = lineWidths.map(function ({ lineWidth, spaces }, i, lineWidths) {
		// This conditional is to ensure we don't calculate the ratio
		// for the last line as it is not justified.
		if (i === lineWidths.length - 1) return 0;
		const availableWidth = width - lineWidth;
		return availableWidth / (spaces * (availableWidth > 0 ? stretchWidth : shrinkWidth));
	});

	// set the ratios
	const ratiosList = document.createElement('ul');

	ratios.forEach(ratio => {
		const li = document.createElement('li');
		li.appendChild(document.createTextNode(ratio.toFixed(3)));
		ratiosList.appendChild(li);
	});

	browserElement.parentNode.appendChild(ratiosList);	
}
