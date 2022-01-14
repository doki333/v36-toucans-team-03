const signUpBtn = document.querySelector('.signUp_btn');
const signInBtn = document.querySelector('.signIn_btn');

const signUpModal = document.querySelector('.signUp_modal');
const signInModal = document.querySelector('.signIn_modal');

const signUpCancel = document.querySelector('.signUp_cancel');
const signInCancel = document.querySelector('.signIn_cancel');

const signUpInput = document.querySelectorAll('.signUp_input');
const signInInput = document.querySelectorAll('.signIn_input');

signUpBtn.addEventListener('click', () => {
	signUpModal.classList.add('active');
});

signInBtn.addEventListener('click', () => {
	signInModal.classList.add('active');
});

signUpCancel.addEventListener('click', () => {
	signUpModal.classList.remove('active');
	signUpInput.forEach((f) => {
		f.value = '';
	});
});

signInCancel.addEventListener('click', () => {
	signInModal.classList.remove('active');
	signInInput.forEach((f) => {
		f.value = '';
	});
});
