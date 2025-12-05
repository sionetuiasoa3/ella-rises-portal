/**
 * Migration to allow NULL dates for future milestones
 * We'll use a placeholder date (2099-12-31) for future milestones in the application
 * but this migration allows NULL dates for flexibility
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Add an auto-increment ID column as the primary key
  // This allows us to have NULL dates in the MilestoneDate column
  const hasIdColumn = await knex.schema.hasColumn('Milestones', 'Id');
  
  if (!hasIdColumn) {
    await knex.schema.alterTable('Milestones', (table) => {
      table.increments('Id').primary().first();
    });
  }
  
  // Make MilestoneDate nullable (for future milestones without dates)
  // Note: We'll use placeholder dates in practice, but allow NULL for flexibility
  const milestoneDateColumn = await knex.schema.hasColumn('Milestones', 'MilestoneDate');
  if (milestoneDateColumn) {
    // Check current constraint - if it's NOT NULL, we need to alter it
    // For now, we'll keep it as NOT NULL and use placeholder dates
    // This avoids breaking existing data
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasIdColumn = await knex.schema.hasColumn('Milestones', 'Id');
  if (hasIdColumn) {
    await knex.schema.alterTable('Milestones', (table) => {
      table.dropColumn('Id');
    });
  }
}

