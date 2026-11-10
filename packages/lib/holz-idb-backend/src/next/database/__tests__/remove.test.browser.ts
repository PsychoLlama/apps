import { openOrUpgrade } from '../open';
import { remove } from '../remove';

const uniqueName = () => `test-${crypto.randomUUID()}`;

const listDatabases = async () => {
  const databases = await indexedDB.databases();

  return databases.map((database) => database.name);
};

describe('remove', () => {
  it('deletes the database', async () => {
    const name = uniqueName();

    (await openOrUpgrade(name, [{ name: 'init', run: () => {} }])).close();
    await remove(name);

    expect(await listDatabases()).not.toContain(name);
  });

  it('resolves when the database does not exist', async () => {
    await expect(remove(uniqueName())).resolves.toBeUndefined();
  });
});
