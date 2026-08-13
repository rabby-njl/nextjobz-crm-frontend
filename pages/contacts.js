// pages/contacts.js — Contacts list (#/contacts), linked to employers.

(function () {
  const C = window.APP_CONSTANTS;

  function textInput(val, placeholder) {
    const inp = Utils.el('input');
    inp.type = 'text';
    inp.value = val || '';
    inp.placeholder = placeholder || '';
    return inp;
  }

  function field(label, control, required) {
    const div = Utils.el('div', 'field');
    const lbl = Utils.el('label', '', label);
    if (required) lbl.appendChild(Utils.el('span', 'req', ' *'));
    div.appendChild(lbl);
    div.appendChild(control);
    return div;
  }

  function checkboxInput(labelText, checked) {
    const label = Utils.el('label', 'checkbox-label');
    const cb = Utils.el('input');
    cb.type = 'checkbox';
    cb.checked = !!checked;
    label.appendChild(cb);
    label.appendChild(Utils.el('span', '', labelText));
    return { el: label, getValue: function () { return cb.checked; } };
  }

  function buildContactForm(contact) {
    contact = contact || {};
    const form = Utils.el('div', 'form-grid');

    const company = Components.searchableSelect(C.companies, contact.company, 'Type to search company');
    const name = textInput(contact.name, 'Contact One');
    const designation = textInput(contact.designation, 'HR Manager');
    const phone = textInput(contact.phone, '01700000000');
    const email = textInput(contact.email, 'name@example.com');
    const primary = checkboxInput('Primary contact for this employer', contact.isPrimary);

    form.appendChild(field('Company', company.el, true));
    form.appendChild(field('Name', name, true));
    form.appendChild(field('Designation', designation, false));
    form.appendChild(field('Phone', phone, false));
    form.appendChild(field('Email', email, false));
    const primField = field('', primary.el, false);
    primField.classList.add('full');
    form.appendChild(primField);

    return {
      el: form,
      values: function () {
        return {
          company: company.getValue(),
          name: name.value.trim(),
          designation: designation.value.trim(),
          phone: phone.value.trim(),
          email: email.value.trim(),
          isPrimary: primary.getValue()
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.company) errs.push('Company is required.');
        if (!v.name) errs.push('Name is required.');
        if (v.phone && !Utils.isValidBDPhone(v.phone)) errs.push('Phone must be 11 digits starting 01.');
        if (v.email && !Utils.isValidEmail(v.email)) errs.push('Email looks wrong.');
        return errs;
      }
    };
  }

  function openContactForm(contact, onSaved) {
    const isEdit = !!contact;
    const form = buildContactForm(contact);
    Components.modal({
      title: isEdit ? 'Edit Contact' : 'Add New Contact',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Contact', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();

            const persist = function () {
              if (isEdit) {
                return api.contacts.update(contact.id, data);
              }
              return api.contacts.create(data);
            };

            // Enforce "only one primary contact per employer".
            const doSave = function () {
              if (!data.isPrimary) return persist();
              return api.contacts.list({ company: data.company }).then(function (list) {
                const existing = list.find(function (c) { return c.isPrimary && c.id !== (contact ? contact.id : null); });
                if (existing) return api.contacts.update(existing.id, { isPrimary: false }).then(persist);
                return persist();
              });
            };

            doSave().then(function () {
              close();
              Components.toast(isEdit ? 'Contact updated' : 'Contact added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  function confirmDelete(contact, onDone) {
    Components.modal({
      title: 'Delete Contact',
      body: Utils.el('p', '', 'Delete ' + contact.name + ' at ' + contact.company + '? This cannot be undone.'),
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: 'Delete', class: 'btn--danger',
          onClick: function (close) {
            api.contacts.remove(contact.id).then(function () {
              close(); Components.toast('Contact deleted', 'success'); if (onDone) onDone();
            });
          }
        }
      ]
    });
  }

  let currentSearch = '';

  function renderListInto(container) {
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.contacts.list().then(function (contacts) {
      let rows = contacts.slice();
      if (currentSearch) {
        const q = currentSearch.toLowerCase();
        rows = rows.filter(function (c) {
          return (c.name || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q);
        });
      }
      const tbl = Components.table({
        columns: [
          {
            key: 'name', label: 'Contact',
            render: function (r) {
              const w = Utils.el('div');
              w.appendChild(Utils.el('div', 'td-strong', r.name));
              w.appendChild(Utils.el('div', 'td-sub', r.id));
              return w;
            }
          },
          { key: 'company', label: 'Company', render: function (r) { return r.company; } },
          { key: 'designation', label: 'Designation', render: function (r) { return r.designation || '—'; } },
          { key: 'phone', label: 'Phone', render: function (r) { return r.phone || '—'; } },
          { key: 'email', label: 'Email', render: function (r) { return r.email || '—'; } },
          { key: 'isPrimary', label: 'Primary', render: function (r) { return r.isPrimary ? Components.badge('green', 'Primary') : Components.badge('gray', '—'); } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openContactForm(r, loadAndRender); });
              const del = Utils.el('button', 'btn btn--ghost btn--sm', 'Delete');
              del.type = 'button';
              del.addEventListener('click', function () { confirmDelete(r, loadAndRender); });
              w.appendChild(edit);
              w.appendChild(del);
              return w;
            }
          }
        ],
        rows: rows,
        empty: {
          title: 'No contacts yet',
          text: 'Add your first contact to link people to employers.',
          actionLabel: 'Add Contact',
          onAction: function () { openContactForm(null, loadAndRender); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function loadAndRender() {
    renderListInto(document.getElementById('contactTable'));
  }

  function renderList(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Contact');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openContactForm(null, loadAndRender); });

    view.appendChild(Components.pageHead({
      title: 'Contacts',
      desc: 'People at your client companies. One primary contact per employer.',
      actions: [addBtn]
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search name or company',
      onInput: function (q) { currentSearch = q; loadAndRender(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'contactTable';
    wrap.style.marginTop = '16px';
    view.appendChild(wrap);

    loadAndRender();
  }

  Router.route('/contacts', renderList, { screen: 'contacts', title: 'Contacts' });
})();
