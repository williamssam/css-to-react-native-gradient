const inputEl = document.getElementById("css-input");
const previewEl = document.getElementById("preview");
const convertBtn = document.getElementById("convert-btn");
const errorEl = document.getElementById("error-message");
const tabs = document.querySelectorAll(".tab");
const examples = document.querySelectorAll(".example");
const gradientListEl = document.getElementById("gradient-list");

let currentTab = "expo";

// Example click handler
for (const example of examples) {
	example.addEventListener("click", () => {
		const gradientValue = example.getAttribute("data-gradient");
		inputEl.value = gradientValue;
		previewEl.style.background = gradientValue;
		convertGradient();
	});
}

// Tab click handler
for (const tab of tabs) {
	tab.addEventListener("click", () => {
		tabs.forEach((t) => t.classList.remove("active"));
		tab.classList.add("active");
		currentTab = tab.getAttribute("data-tab");
		updateOutputs();
	});
}
// Convert button click handler
convertBtn.addEventListener("click", convertGradient);

// CSS input change handler
inputEl.addEventListener("input", () => {
	try {
		previewEl.style.background = inputEl.value.startsWith("background:")
			? inputEl.value.substring("background:".length).trim()
			: inputEl.value;
		errorEl.textContent = "";
	} catch (e) {
		// Invalid CSS, but don't show error yet
	}
});

function convertGradient() {
	let cssInput = inputEl.value.trim();

	if (!cssInput) {
		gradientListEl.innerHTML = "";
		errorEl.textContent = "";
		return;
	}

	try {
		// Update preview
		previewEl.style.background = cssInput;

		// Handle "background:" prefix
		if (cssInput.startsWith("background:")) {
			cssInput = cssInput.substring("background:".length).trim();
		}

		// Split multiple gradients
		const gradients = cssInput.split(/,(?=\s*linear-gradient)/);

		if (gradients.length === 0) {
			errorEl.textContent =
				"No valid gradients found. Please check the format.";
			return;
		}

		const parsedGradients = [];

		// Parse each gradient
		for (let i = 0; i < gradients.length; i++) {
			const gradient = gradients[i].trim();
			const result = parseGradient(gradient);

			if (result) {
				parsedGradients.push(result);
			}
		}

		if (parsedGradients.length === 0) {
			errorEl.textContent =
				"Could not parse any gradients. Please check the format.";
			return;
		}

		errorEl.textContent = "";

		// Display parsed gradients
		displayGradients(parsedGradients);
	} catch (error) {
		errorEl.textContent = "Invalid gradient format: " + error.message;
		gradientListEl.innerHTML = "";
	}
}

function displayGradients(gradients) {
	gradientListEl.innerHTML = "";

	gradients.forEach((gradient, index) => {
		const gradientItem = document.createElement("div");
		gradientItem.className = "gradient-item";

		const gradientHeader = document.createElement("div");
		gradientHeader.className = "gradient-header";

		const gradientTitle = document.createElement("h4");
		gradientTitle.textContent = `Gradient ${index + 1}`;

		const copyBtn = document.createElement("button");
		copyBtn.className = "copy-btn";
		copyBtn.textContent = "Copy";
		copyBtn.onclick = function () {
			const outputEl = gradientItem.querySelector(".output");
			navigator.clipboard.writeText(outputEl.textContent).then(() => {
				const originalText = copyBtn.textContent;
				copyBtn.textContent = "Copied!";
				setTimeout(() => {
					copyBtn.textContent = originalText;
				}, 2000);
			});
		};

		gradientHeader.appendChild(gradientTitle);
		gradientHeader.appendChild(copyBtn);

		const gradientPreview = document.createElement("div");
		gradientPreview.className = "gradient-preview";

		// Create preview based on the parsed gradient
		const previewGradient = `linear-gradient(${gradient.angle}deg, ${gradient.colors
			.map((color, i) => `${color} ${gradient.locations[i] * 100}%`)
			.join(", ")})`;
		gradientPreview.style.background = previewGradient;

		const outputContainer = document.createElement("div");
		outputContainer.className = "output-container";

		const output = document.createElement("pre");
		output.className = "output";

		// Generate code based on selected tab
		if (currentTab === "expo") {
			output.textContent = generateExpoCode(gradient);
		} else {
			output.textContent = generateRNCode(gradient);
		}

		outputContainer.appendChild(output);

		gradientItem.appendChild(gradientHeader);
		gradientItem.appendChild(gradientPreview);
		gradientItem.appendChild(outputContainer);

		gradientListEl.appendChild(gradientItem);
	});
}

function updateOutputs() {
	const gradientItems = gradientListEl.querySelectorAll(".gradient-item");

	gradientItems.forEach((item, index) => {
		const output = item.querySelector(".output");
		const gradientIndex =
			parseInt(item.querySelector("h4").textContent.replace("Gradient ", "")) -
			1;

		// Get the original gradient data
		const cssInput = inputEl.value.trim();
		let gradientInput = cssInput;

		// Handle "background:" prefix
		if (gradientInput.startsWith("background:")) {
			gradientInput = gradientInput.substring("background:".length).trim();
		}

		// Split multiple gradients
		const gradients = gradientInput.split(/,(?=\s*linear-gradient)/);
		const gradient = parseGradient(gradients[gradientIndex].trim());

		if (gradient) {
			// Generate code based on selected tab
			if (currentTab === "expo") {
				output.textContent = generateExpoCode(gradient);
			} else {
				output.textContent = generateRNCode(gradient);
			}
		}
	});
}

function parseGradient(cssGradient) {
	// Match linear-gradient pattern with more flexible format
	const regex =
		/linear-gradient\(\s*((?:to\s+(?:top|bottom|left|right|top\s+left|top\s+right|bottom\s+left|bottom\s+right)|[0-9.-]+deg))?\s*,\s*([^)]+)\)/i;
	const match = cssGradient.match(regex);

	if (!match) {
		return null;
	}

	let direction = match[1] || "to bottom";
	const colorStops = match[2].split(",").map((stop) => stop.trim());

	// Convert CSS direction to angle in degrees for React Native
	let angle = 0;
	if (direction.includes("deg")) {
		// Direct degree value
		angle = parseFloat(direction);
	} else {
		// Convert 'to direction' format to degrees
		switch (direction) {
			case "to right":
				angle = 90;
				break;
			case "to left":
				angle = 270;
				break;
			case "to top":
				angle = 0;
				break;
			case "to bottom":
				angle = 180;
				break;
			case "to top right":
			case "to right top":
				angle = 45;
				break;
			case "to top left":
			case "to left top":
				angle = 315;
				break;
			case "to bottom right":
			case "to right bottom":
				angle = 135;
				break;
			case "to bottom left":
			case "to left bottom":
				angle = 225;
				break;
			default:
				angle = 180; // Default to 'to bottom'
		}
	}

	// Parse color stops
	const colors = [];
	const locations = [];

	colorStops.forEach((stop) => {
		// Extract color and position
		const parts = stop.trim().match(/([^0-9.%]+)\s*([0-9.]+%)?/);

		if (parts) {
			const color = parts[1].trim();
			colors.push(color);

			if (parts[2]) {
				// Extract percentage value
				const posMatch = parts[2].match(/([0-9.]+)%/);
				if (posMatch) {
					locations.push(parseFloat(posMatch[1]) / 100);
				}
			}
		}
	});

	// If no explicit locations were found, distribute evenly
	if (locations.length === 0 && colors.length > 0) {
		colors.forEach((_, index) => {
			locations.push(index / (colors.length - 1 || 1));
		});
	}

	// Ensure locations array has same length as colors
	while (locations.length < colors.length) {
		const lastIndex = locations.length - 1;
		if (lastIndex >= 0) {
			// Interpolate position
			const step = locations[lastIndex] / lastIndex || 0;
			locations.push(locations[lastIndex] + step);
		} else {
			// First position
			locations.push(0);
		}
	}

	return {
		angle,
		colors,
		locations,
	};
}

function generateExpoCode({ angle, colors, locations }) {
	// Convert angle to start/end points
	const angleRad = (angle - 90) * (Math.PI / 180);
	const startPoint = {
		x: 0.5 - 0.5 * Math.cos(angleRad),
		y: 0.5 - 0.5 * Math.sin(angleRad),
	};
	const endPoint = {
		x: 0.5 + 0.5 * Math.cos(angleRad),
		y: 0.5 + 0.5 * Math.sin(angleRad),
	};

	// Format with 2 decimal places
	const formatPoint = (point) => {
		return `{ x: ${point.x.toFixed(2)}, y: ${point.y.toFixed(2)} }`;
	};

	const code = `import { LinearGradient } from 'expo-linear-gradient';

// Component
<LinearGradient
  colors={[${colors.map((c) => `'${c}'`).join(", ")}]}
  locations={[${locations.map((l) => l.toFixed(2)).join(", ")}]}
  start={${formatPoint(startPoint)}}
  end={${formatPoint(endPoint)}}
  style={{
    height: 100,
    width: '100%',
    borderRadius: 5
  }}
/>`;

	return code;
}

function generateRNCode({ angle, colors, locations }) {
	const code = `import LinearGradient from 'react-native-linear-gradient';

// Component
<LinearGradient
  colors={[${colors.map((c) => `'${c}'`).join(", ")}]}
  locations={[${locations.map((l) => l.toFixed(2)).join(", ")}]}
  angle={${angle}}
  useAngle={true}
  style={{
    height: 100,
    width: '100%',
    borderRadius: 5
  }}
/>`;

	return code;
}

// Initialize with an example
inputEl.value =
	"background: linear-gradient(90deg, #6F42C1 0%, #341F5B 100%), linear-gradient(270deg, rgba(111, 66, 193, 0.016) -14.29%, rgba(254, 237, 227, 0.4) 100%)";
previewEl.style.background = inputEl.value;
convertGradient();
