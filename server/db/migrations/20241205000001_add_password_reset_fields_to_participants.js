/**
 * Migration to add PasswordResetToken and PasswordResetExpires columns to Participants table
 * These fields are used for password creation and reset flows
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasPasswordResetToken = await knex.schema.hasColumn('Participants', 'PasswordResetToken');
  const hasPasswordResetExpires = await knex.schema.hasColumn('Participants', 'PasswordResetExpires');
  
  if (!hasPasswordResetToken) {
    await knex.schema.alterTable('Participants', (table) => {
      table.string('PasswordResetToken', 255).nullable();
    });
  }
  
  if (!hasPasswordResetExpires) {
    await knex.schema.alterTable('Participants', (table) => {
      table.timestamp('PasswordResetExpires', { useTz: false }).nullable();
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasPasswordResetToken = await knex.schema.hasColumn('Participants', 'PasswordResetToken');
  const hasPasswordResetExpires = await knex.schema.hasColumn('Participants', 'PasswordResetExpires');
  
  if (hasPasswordResetToken) {
    await knex.schema.alterTable('Participants', (table) => {
      table.dropColumn('PasswordResetToken');
    });
  }
  
  if (hasPasswordResetExpires) {
    await knex.schema.alterTable('Participants', (table) => {
      table.dropColumn('PasswordResetExpires');
    });
  }
}

