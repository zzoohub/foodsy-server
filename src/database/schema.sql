-- Foodsy Database Schema
-- 도메인 기반 구조에 맞춘 테이블 설계 (요구사항 반영)

-- Gender enum 타입 생성
CREATE TYPE gender_type AS ENUM ('male', 'female', 'unknown');

-- 사용자 테이블 (username을 PK로 사용)
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) PRIMARY KEY,
    gender gender_type DEFAULT 'unknown',
    phone_number VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    bio TEXT,
    profile_picture VARCHAR(500),
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포스트 테이블
CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200),
    content TEXT,
    user_id VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    medias TEXT[], -- 이미지/비디오 링크 배열
    calorie INTEGER CHECK (calorie >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 팔로우 테이블
CREATE TABLE IF NOT EXISTS follows (
    following_user_id VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    followed_user_id VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (following_user_id, followed_user_id),
    CHECK (following_user_id != followed_user_id)
);

-- 좋아요 테이블
CREATE TABLE IF NOT EXISTS like_posts (
    user_id VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_user_id);
CREATE INDEX IF NOT EXISTS idx_like_posts_user ON like_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_like_posts_post ON like_posts(post_id);

-- 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 