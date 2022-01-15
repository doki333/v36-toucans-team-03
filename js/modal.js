// Modal Validation functionality
form.addEventListener('submit', function (e) {
	e.preventDefault();

	let isUserValid = checkUserName(),
		isEmailValid = checkEmail(),
		isPassValid = checkPass();

	let isFormValid = isUserValid && is isEmailValid && isPassValid;
	if (isFormValid){}
});

form.addEventListener('input', function()){
	
}
const uname = document.signUpForm.name.value;
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

// Checks to see if the password is strong according to set parameters
const isPassSecure = (password) => {
	const re = new RegExp(
		'^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*{8,})'
	);
	return re.test(password);
};

// Show Error
const showError = (input, message) => {
	// Get the form field Input
	const formContent = input.parentElement;
	// Add the error class
	formContent.classList.remove('success');
	formContent.classList.add('error');
	// Display the error message
	const error = formContent.queryselector('small');
	error.textContent = message;
};

// Show Success
const showSuccess = (input, message) => {
	// Get the form field Input
	const formContent = input.parentElement;
	// Add the error class
	formContent.classList.remove('error');
	formContent.classList.add('success');
	// Display the error message
	const error = formContent.queryselector('small');
	error.textContent = '';
};

// Check Username Exists
const checkUserName = () => {
	let valid = false;
	const min = 3,
		max = 12;

	const username = uname.value.trim();

	if (!isRequired(username)) {
		showError(uname, 'Username cannot be blank.');
	} else if (!isBetween(username.length, min, max)) {
		showError(uname, `Username must be between ${min} and ${max} characters.`);
	} else {
		showSuccess(uname);
		valid = true;
	}
	return valid;
};

// Check Email
const checkEmail = () => {
	let valid = false;
	const email = signUpEmail.value.trim();
	if (!isRequired(signUpEmail)) {
		showError(signUpEmail, 'Email cannot be blank.');
	} else if (!isEmailValid(signUpEmail)) {
		showError(signUpEmail, 'Email is not valid.');
	} else {
		showSuccess(signUpEmail);
		valid = true;
	}
	return valid;
};

// Check Password is Valid
const checkPass = () => {
	let valid = false;
	const password = signUpPass.value.trim();
	if (!isRequired(password)) {
		showError(signUpPass, 'Password cannot be blank.');
	} else if (!isPassSecure(signUpPass)) {
		showError(
			signUpPass,
			'Password must has at least 8 characters that include at least 1 lowercase character, 1 uppercase characters, 1 number, and 1 special character in (!@#$%^&*)'
		);
	} else {
		showSuccess(signUpPass);
		valid = true;
	}
	return valid;
};
