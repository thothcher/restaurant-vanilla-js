(function (App) {
  const { api, ui } = App;
  const { field, bindForm, toast, esc } = ui;

  const shell = (title, sub, body, foot = '') => `
    <div class="auth">
      <div class="auth-card" data-aos="fade-up">
        <h1>${esc(title)}</h1><p class="muted">${sub}</p>
        <form id="form" novalidate>${body}</form>
        ${foot ? `<p class="auth-foot">${foot}</p>` : ''}
      </div>
    </div>`;
  const submit = (label) => `<button class="btn btn-primary btn-block" type="submit">${esc(label)}</button>`;
  const safeNext = (n) => (n && /^\/[^/]/.test(n) ? n : '/menu');

  App.pages.login = ({ root, query }) => {
    root.innerHTML = shell('Welcome back', 'Sign in to manage your cart and orders.',
      field({ name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email', value: query.email }) +
      field({ name: 'password', label: 'Password', type: 'password', required: true, autocomplete: 'current-password' }) +
      '<a class="link small" href="/forgot">Forgot password?</a>' + submit('Sign in'),
      'New here? <a href="/register">Create an account</a>');

    bindForm(root.querySelector('#form'), async (v) => {
      const res = await api.login({ email: v.email.trim(), password: v.password });
      if (res.isVerified === false) {
        toast('Please verify your email first', 'info');
        return App.navigate(`/verify?email=${encodeURIComponent(v.email.trim())}&resend=1`);
      }
      await App.afterLogin(res);
      toast('Signed in', 'success');
      App.navigate(safeNext(query.next));
    });
  };

  App.pages.register = ({ root }) => {
    root.innerHTML = shell('Create account', 'Join us to start ordering.',
      '<div class="row2">' +
        field({ name: 'firstName', label: 'First name', required: true, autocomplete: 'given-name', extra: 'minlength="2"' }) +
        field({ name: 'lastName', label: 'Last name', required: true, autocomplete: 'family-name', extra: 'minlength="2"' }) + '</div>' +
      field({ name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' }) +
      field({ name: 'password', label: 'Password', type: 'password', required: true, autocomplete: 'new-password', rule: 'password' }) +
      field({ name: 'confirm', label: 'Confirm password', type: 'password', required: true, autocomplete: 'new-password', match: 'password' }) +
      submit('Create account'),
      'Already registered? <a href="/login">Sign in</a>');

    bindForm(root.querySelector('#form'), async (v) => {
      const email = v.email.trim();
      await api.register({ firstName: v.firstName.trim(), lastName: v.lastName.trim(), email, password: v.password });
      toast('Account created — check your email for a code', 'success');
      App.navigate(`/verify?email=${encodeURIComponent(email)}`);
    });
  };

  App.pages.verify = ({ root, query }) => {
    const email = query.email || '';
    root.innerHTML = shell('Verify your email', `Enter the code we sent${email ? ` to <strong>${esc(email)}</strong>` : ''}.`,
      field({ name: 'email', label: 'Email', type: 'email', required: true, value: email, autocomplete: 'email' }) +
      field({ name: 'code', label: 'Verification code', required: true, autocomplete: 'one-time-code', extra: 'inputmode="numeric"' }) +
      submit('Verify') + '<button type="button" class="link small" id="resend">Resend code</button>',
      '<a href="/login">Back to sign in</a>');

    const form = root.querySelector('#form');
    bindForm(form, async (v) => {
      const res = await api.verifyEmail({ email: v.email.trim(), code: v.code.trim() });
      await App.afterLogin(res);
      toast('Email verified — welcome!', 'success');
      App.navigate('/menu');
    });

    const resend = async () => {
      const input = form.elements.email;
      if (!input.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) return input.focus();
      try { await api.resendVerification(input.value.trim()); toast('A new code has been sent', 'success'); }
      catch (err) { toast(err.message, 'error'); }
    };
    root.querySelector('#resend').addEventListener('click', resend);
    if (query.resend && email) resend();
  };

  App.pages.forgot = ({ root }) => {
    root.innerHTML = shell('Forgot password?', "Enter your email and we'll send a reset code.",
      field({ name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' }) + submit('Send code'),
      '<a href="/login">Back to sign in</a>');
    bindForm(root.querySelector('#form'), async (v) => {
      await api.forgotPassword(v.email.trim());
      toast('If the account exists, a code is on its way', 'success');
      App.navigate('/reset');
    });
  };

  App.pages.reset = ({ root }) => {
    root.innerHTML = shell('Reset password', 'Paste the code from your email and choose a new password.',
      field({ name: 'token', label: 'Reset code', required: true }) +
      field({ name: 'newPassword', label: 'New password', type: 'password', required: true, autocomplete: 'new-password', rule: 'password' }) +
      field({ name: 'confirm', label: 'Confirm new password', type: 'password', required: true, autocomplete: 'new-password', match: 'newPassword' }) +
      submit('Reset password'),
      '<a href="/login">Back to sign in</a>');
    bindForm(root.querySelector('#form'), async (v) => {
      await api.resetPassword({ token: v.token.trim(), newPassword: v.newPassword });
      toast('Password updated — please sign in', 'success');
      App.navigate('/login');
    });
  };
})(window.App);
