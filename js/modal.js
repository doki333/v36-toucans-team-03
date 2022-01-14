// Modal Validation functionality
function validateForm() {}
const username = document.signUpForm.name.value;
const signUpEmail = document.signUpForm.email.value;
const signUpPass = document.signUpForm.password.value;
// isRequired returns true if input argument is empty
const isRequired = (value) => (value === '' ? true : false);

// is Between returns false if the length is not between min and max
const isBetween = (length, min, max) =>
	length < min || length > max ? false : true;

// isValid checks if email follows Regex Expression
const isEmailValid = (email) => {
	const re =
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
};

const showError = (input, message) => {
	// Get the form field Input
	const formField = input.parentElement;
	// Add the error class
	formField.classList.remove('success');
	formField.classList.add('error');
};
