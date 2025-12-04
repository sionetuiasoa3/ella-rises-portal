/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('PasswordTokens');
  if (exists) return;

  await knex.schema.createTable('PasswordTokens', (table) => {
    table.increments('Id').primary();
    table
      .integer('ParticipantID')
      .notNullable()
      .references('ParticipantID')
      .inTable('Participants')
      .onDelete('CASCADE');
    table.uuid('Token').notNullable().unique();
    table.timestamp('ExpiresAt', { useTz: false }).notNullable();
    table.timestamp('UsedAt', { useTz: false }).nullable();
    table.string('Purpose', 50).notNullable(); // e.g. 'create_password', 'reset_password'
    table.timestamp('CreatedAt', { useTz: false }).defaultTo(knex.fn.now());
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  const exists = await knex.schema.hasTable('PasswordTokens');
  if (!exists) return;
  await knex.schema.dropTable('PasswordTokens');
}


