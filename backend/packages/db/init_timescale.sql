-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create raw price feed table
CREATE TABLE ticks (
    ts TIMESTAMPTZ NOT NULL,
    symbol TEXT NOT NULL,
    price BIGINT NOT NULL,      
    decimals INTEGER NOT NULL
);

CREATE INDEX ON ticks(symbol, ts);

-- Convert to hypertable
SELECT create_hypertable('ticks', 'ts');

-- Create 1 min candles
CREATE MATERIALIZED VIEW candles_1m
WITH (timescaledb.continuous) AS
    SELECT
        symbol,
        time_bucket('1 minute', ts) AS bucket,
        FIRST(price, ts) AS "open",
        MAX(price) AS high,
        MIN(price) AS low,
        LAST(price, ts) AS "close"
    FROM ticks
    GROUP BY bucket, symbol;

CREATE INDEX IF NOT EXISTS candles_1m_idx ON candles_1m ("symbol", bucket);

-- Create 5 min candles
CREATE MATERIALIZED VIEW candles_5m
WITH (timescaledb.continuous) AS
    SELECT
        symbol,
        time_bucket('5 minutes', ts) AS bucket,
        FIRST(price, ts) AS "open",
        MAX(price) AS high,
        MIN(price) AS low,
        LAST(price, ts) AS "close"
    FROM ticks
    GROUP BY bucket, symbol;

CREATE INDEX IF NOT EXISTS candles_5m_idx ON candles_5m ("symbol", bucket);

-- Create 15 min candles
CREATE MATERIALIZED VIEW candles_15m
WITH (timescaledb.continuous) AS
    SELECT
        symbol,
        time_bucket('15 minutes', ts) AS bucket,
        FIRST(price, ts) AS "open",
        MAX(price) AS high,
        MIN(price) AS low,
        LAST(price, ts) AS "close"
    FROM ticks
    GROUP BY bucket, symbol;

CREATE INDEX IF NOT EXISTS candles_15m_idx ON candles_15m ("symbol", bucket);

-- Create 1 hour candles
CREATE MATERIALIZED VIEW candles_1h
WITH (timescaledb.continuous) AS
    SELECT
        symbol,
        time_bucket('1 hour', ts) AS bucket,
        FIRST(price, ts) AS "open",
        MAX(price) AS high,
        MIN(price) AS low,
        LAST(price, ts) AS "close"
    FROM ticks
    GROUP BY bucket, symbol;

CREATE INDEX IF NOT EXISTS candles_1h_idx ON candles_1h ("symbol", bucket);

-- Add refresh policies to auto update 
SELECT add_continuous_aggregate_policy(
  'candles_1m'::regclass, 
  start_offset => NULL, 
  end_offset => '1 mins'::interval,  
  schedule_interval => '1 mins'::interval
);

SELECT add_continuous_aggregate_policy(
  'candles_5m'::regclass, 
  start_offset => NULL, 
  end_offset => '5 mins'::interval,  
  schedule_interval => '5 mins'::interval
);

SELECT add_continuous_aggregate_policy(
  'candles_15m'::regclass, 
  start_offset => NULL, 
  end_offset => '15 mins'::interval,  
  schedule_interval => '15 mins'::interval
);

SELECT add_continuous_aggregate_policy(
  'candles_1h'::regclass, 
  start_offset => NULL, 
  end_offset => '1 hour'::interval,  
  schedule_interval => '1 hour'::interval
);

ALTER TABLE ticks
  SET (timescaledb.compress,
       timescaledb.compress_segmentby = 'symbol',
       timescaledb.compress_orderby = 'ts DESC');

SELECT add_compression_policy('ticks', '3 days'::interval);
