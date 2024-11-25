CREATE TABLE IF NOT EXISTS form_templates (
      id UUID PRIMARY KEY,
      version  VARCHAR(10),
      ministry_id  VARCHAR(10),
      last_modified TIMESTAMPTZ,
      title TEXT,
      form_id  TEXT,
      dataSources JSONB,
      data JSONB NOT NULL
    );