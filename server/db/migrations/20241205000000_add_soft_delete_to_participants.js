/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('Participants', (table) => {
    table.boolean('IsDeleted').defaultTo(false).notNullable();
    table.timestamp('DeletedAt').nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('Participants', (table) => {
    table.dropColumn('IsDeleted');
    table.dropColumn('DeletedAt');
  });
}

