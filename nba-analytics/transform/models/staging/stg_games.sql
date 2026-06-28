{{ config(materialized='view') }}

SELECT
    game_id,
    CAST(game_date AS DATE) as game_date,
    team_id_home,
    team_id_away
FROM {{ source('raw', 'kaggle_game') }}
WHERE game_date IS NOT NULL
LIMIT 10000