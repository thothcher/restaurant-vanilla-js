(function (App) {
  const { api, ui, store } = App;
  const { field, bindForm, toast, esc } = ui;

  App.pages.profile = async ({ root }) => {
    root.innerHTML = '<div class="container"><div class="skeleton detail-skel"></div></div>';
    let p;
    try { p = await api.profile(); }
    catch (err) {
      root.innerHTML = `<div class="container">${ui.errorState(err)}</div>`;
      root.querySelector('[data-retry]')?.addEventListener('click', () => App.pages.profile({ root }));
      return;
    }
    if (!root.isConnected) return;

    const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase();
    root.innerHTML = `
      <div class="container narrow">
        <header class="profile-head" data-aos="fade-up">
          <div class="avatar">${p.picture ? ui.img(p.picture, 'Profile picture', '', true) : (esc(initials) || ui.icon('user'))}</div>
          <div><h1>${esc(p.firstName)} ${esc(p.lastName)}</h1><p class="muted">${esc(p.email)}</p></div>
        </header>

        <section class="panel" data-aos="fade-up"><h2>Personal information</h2>
          <form id="edit" novalidate>
            <div class="row2">
              ${field({ name: 'firstName', label: 'First name', value: p.firstName, required: true, extra: 'minlength="2"' })}
              ${field({ name: 'lastName', label: 'Last name', value: p.lastName, required: true, extra: 'minlength="2"' })}
            </div>
            <div class="row2">
              ${field({ name: 'phoneNumber', label: 'Phone', type: 'tel', value: p.phoneNumber, autocomplete: 'tel', rule: 'phone' })}
              ${field({ name: 'age', label: 'Age', type: 'number', value: p.age, extra: 'min="0" max="120"' })}
            </div>
            ${field({ name: 'address', label: 'Delivery address', value: p.address, autocomplete: 'street-address' })}
            ${field({ name: 'picture', label: 'Picture URL', type: 'url', value: p.picture })}
            <button class="btn btn-primary" type="submit">Save changes</button>
          </form>
        </section>

        <section class="panel" data-aos="fade-up"><h2>Change password</h2>
          <form id="pw" novalidate>
            ${field({ name: 'oldPassword', label: 'Current password', type: 'password', required: true, autocomplete: 'current-password' })}
            ${field({ name: 'newPassword', label: 'New password', type: 'password', required: true, autocomplete: 'new-password', rule: 'password' })}
            ${field({ name: 'confirmPassword', label: 'Confirm new password', type: 'password', required: true, autocomplete: 'new-password', match: 'newPassword' })}
            <button class="btn btn-primary" type="submit">Update password</button>
          </form>
        </section>

        <section class="panel danger-zone" data-aos="fade-up"><h2>Delete account</h2>
          <p class="muted">This permanently removes your account and cart. This cannot be undone.</p>
          <button class="btn btn-danger" id="delete">${ui.icon('trash')} Delete my account</button>
        </section>
      </div>`;

    bindForm(root.querySelector('#edit'), async (v) => {
      const body = {
        firstName: v.firstName.trim(), lastName: v.lastName.trim(),
        phoneNumber: v.phoneNumber.trim() || null, address: v.address.trim() || null,
        picture: v.picture.trim() || null, age: v.age === '' ? null : Number(v.age),
      };
      await api.editProfile(body);
      store.setUser({ ...store.user, firstName: body.firstName, lastName: body.lastName });
      toast('Profile updated', 'success');
      App.pages.profile({ root });
    });

    bindForm(root.querySelector('#pw'), async (v, form) => {
      await api.changePassword(v);
      form.reset();
      form.querySelectorAll('input').forEach((i) => { delete i.dataset.touched; });
      form.querySelectorAll('.pw-rules li').forEach((li) => li.classList.remove('ok'));
      toast('Password changed', 'success');
    });

    root.querySelector('#delete').addEventListener('click', async () => {
      const ok = await ui.confirmDialog({
        title: 'Delete your account?', message: 'All your data will be permanently deleted.', confirmText: 'Delete account', danger: true,
      });
      if (!ok) return;
      try {
        await api.deleteAccount();
        store.clear();
        toast('Your account was deleted', 'info');
        App.navigate('/');
      } catch (err) { toast(err.message, 'error'); }
    });
    App.refreshEffects();
  };
})(window.App);
