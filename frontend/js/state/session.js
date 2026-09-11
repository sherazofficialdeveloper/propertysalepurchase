/**
 * Shared session helper — thin wrapper around Auth for non-auth pages.
 * Keeps a synchronous cache after first resolve.
 */
(function (global) {
  'use strict';

  let user = null;
  let resolved = false;

  async function ensure() {
    if (resolved) return user;
    if (!global.Auth) { resolved = true; user = null; return null; }
    await global.Auth.init();
    user = global.Auth.getUser();
    resolved = true;
    return user;
  }

  function current() { return user; }
  function role() { return user && user.role; }
  function isAdmin() { return role() === 'admin'; }
  function isSeller() { return role() === 'seller'; }

  global.Session = { ensure, current, role, isAdmin, isSeller };
})(window);
