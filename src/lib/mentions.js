export const getMentionHandle = (user) =>
  (user?.name || 'ClassSyncUser')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 24) || 'ClassSyncUser';

export const findMentionedUsers = (text = '', users = []) => {
  const mentionTokens = new Set(
    [...text.matchAll(/@([a-zA-Z0-9_.-]+)/g)].map((match) => match[1].toLowerCase())
  );

  if (mentionTokens.size === 0) {
    return [];
  }

  return users
    .filter((user) => {
      const handle = getMentionHandle(user).toLowerCase();
      const emailName = String(user.email || '').split('@')[0].toLowerCase();

      return mentionTokens.has(handle) || mentionTokens.has(emailName);
    })
    .map((user) => ({
      id: user.id,
      name: user.name,
      handle: getMentionHandle(user)
    }));
};

export const getMentionSuggestions = (text = '', users = []) => {
  const activeMention = text.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/);

  if (!activeMention) {
    return [];
  }

  const query = activeMention[1].toLowerCase();

  return users
    .filter((user) => {
      const handle = getMentionHandle(user).toLowerCase();
      const emailName = String(user.email || '').split('@')[0].toLowerCase();

      return handle.includes(query) || emailName.includes(query);
    })
    .slice(0, 5);
};

export const appendMention = (text = '', user) => {
  const mentionText = `@${getMentionHandle(user)} `;

  if (/(^|\s)@[a-zA-Z0-9_.-]*$/.test(text)) {
    return text.replace(/(^|\s)@[a-zA-Z0-9_.-]*$/, `$1${mentionText}`);
  }

  const suffix = text && !/\s$/.test(text) ? ' ' : '';
  return `${text}${suffix}${mentionText}`;
};

export const splitTextByMentions = (text = '') => text.split(/(@[a-zA-Z0-9_.-]+)/g);
