/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.alterTable('pdf_templates', (table) => {
        table.string('storage_location').notNullable().defaultTo('pets');
    
        table.binary('template_data').nullable();
    
        table.string('file_name').nullable();
        table.string('content_type').nullable();
      });
    
      await knex.schema.alterTable('pdf_templates', (table) => {
        table.string('template_uuid').nullable().alter();
      });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.alterTable('pdf_templates', (table) => {
        table.dropColumn('template_data');
        table.dropColumn('file_name');
        table.dropColumn('content_type');
        table.dropColumn('storage_location');
      });
    
      await knex.schema.alterTable('pdf_templates', (table) => {
        table.string('template_uuid').notNullable().alter();
      });
};
