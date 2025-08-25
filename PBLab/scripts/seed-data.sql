-- Seed data for testing dashboard functionality
-- Run this after the database schema is applied

-- Insert test user profiles
INSERT INTO user_profiles (id, email, full_name, role, institution) VALUES
('11111111-1111-1111-1111-111111111111', 'test@gmail.com', 'Jordan Smith', 'student', 'Test University'),
('22222222-2222-2222-2222-222222222222', 'educator@test.com', 'Dr. Sarah Johnson', 'educator', 'Test University')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  institution = EXCLUDED.institution;

-- Insert test course
INSERT INTO courses (id, course_name, course_code, description, educator_id) VALUES
('33333333-3333-3333-3333-333333333333', 'Environmental Health Systems', 'EHS 401', 'Problem-based learning in environmental health', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Insert test projects
INSERT INTO projects (id, course_id, project_name, description, problem_statement, current_phase, start_date, end_date) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Outbreak Simulator', 'Develop an epidemiological model for disease outbreak analysis', 'How can we predict and control the spread of infectious diseases in urban environments?', 'analysis', '2025-08-01', '2025-12-15'),
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'EcoBalance', 'Design sustainable environmental monitoring system', 'How can we create cost-effective environmental monitoring for developing communities?', 'problem_identification', '2025-08-15', '2025-12-20')
ON CONFLICT (id) DO NOTHING;

-- Insert test teams
INSERT INTO teams (id, project_id, team_name, team_description) VALUES
('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'Team Alpha', 'Epidemiology research team'),
('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', 'Team Beta', 'Environmental monitoring team')
ON CONFLICT (id) DO NOTHING;

-- Insert team members
INSERT INTO team_members (team_id, student_id, role) VALUES
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'member'),
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'coordinator')
ON CONFLICT (team_id, student_id) DO NOTHING;

-- Insert individual learning objectives
INSERT INTO individual_learning_objectives (id, student_id, project_id, team_id, objective_description, competency_level, progress_status) VALUES
('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'Epidemiology Mastery', 4, 'active'),
('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'Statistical Analysis', 3, 'active'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'Public Health Policy', 3, 'draft'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', 'Environmental Monitoring', 2, 'active'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', 'Sustainability Assessment', 3, 'draft')
ON CONFLICT (id) DO NOTHING;

-- Insert evidence artifacts to create portfolio data
INSERT INTO evidence_artifacts (id, learning_objective_id, student_id, type, title, description, external_url) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'document', 'Disease Transmission Model', 'Mathematical model for infectious disease spread', 'https://example.com/model1'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'presentation', 'Outbreak Response Plan', 'Comprehensive response strategy presentation', 'https://example.com/presentation1'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'reflection', 'Learning Reflection: Week 4', 'Personal reflection on epidemiology concepts', 'https://example.com/reflection1'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', '99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'document', 'Statistical Analysis Report', 'Data analysis of outbreak patterns', 'https://example.com/analysis1'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'code', 'R Analysis Scripts', 'Statistical modeling code in R', 'https://example.com/code1'),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', '99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'document', 'Literature Review', 'Review of statistical methods in epidemiology', 'https://example.com/literature1'),
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'document', 'Sensor Design Document', 'Environmental sensor specifications', 'https://example.com/sensor1'),
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'presentation', 'Monitoring System Overview', 'System architecture presentation', 'https://example.com/system1')
ON CONFLICT (id) DO NOTHING;

-- Insert individual reflections
INSERT INTO individual_reflections (id, student_id, project_id, team_id, pbl_phase, reflection_prompt, reflection_content, quality_score) VALUES
('llllllll-llll-llll-llll-llllllllllll', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'problem_identification', 'What are the key challenges in outbreak prediction?', 'The main challenges include data quality, model accuracy, and real-time processing capabilities...', 8),
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'learning_objectives', 'What specific competencies do you need to develop?', 'I need to strengthen my understanding of epidemiological models and statistical analysis...', 7),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'research', 'What research findings support your approach?', 'Current literature suggests that agent-based models provide better accuracy for urban environments...', 9)
ON CONFLICT (id) DO NOTHING;
