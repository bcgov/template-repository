/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = async function (knex) {
    const exists = await knex.schema.hasTable("form_templates");
    if (!exists) {
      return knex.schema.createTable("form_templates", (table) => {
        table.uuid("id").primary();
        table.string("version", 10);
        table.string("ministry_id", 10);
        table.timestamp("last_modified").defaultTo(knex.fn.now());
        table.text("title");
        table.text("form_id");
        table.string("deployed_to", 10);
        table.jsonb("dataSources");
        table.jsonb("data").notNullable();
      });
    }
    // no-op if table already exists
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function (knex) {
    return knex.schema.dropTableIfExists("form_templates");
  };
  