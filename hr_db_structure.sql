--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: employee_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_history (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    field_changed character varying(50) NOT NULL,
    old_value character varying(100),
    new_value character varying(100),
    change_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_history OWNER TO postgres;

--
-- Name: employee_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.employee_history_id_seq OWNER TO postgres;

--
-- Name: employee_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_history_id_seq OWNED BY public.employee_history.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    hire_date date NOT NULL,
    department_id integer,
    role_id integer,
    is_active boolean DEFAULT true
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: recognitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recognitions (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    message text NOT NULL,
    badge character varying(50) NOT NULL,
    date date NOT NULL
);


ALTER TABLE public.recognitions OWNER TO postgres;

--
-- Name: recognitions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recognitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.recognitions_id_seq OWNER TO postgres;

--
-- Name: recognitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recognitions_id_seq OWNED BY public.recognitions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    salary numeric(10,2) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    employee_id integer,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'employee'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: employee_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_history ALTER COLUMN id SET DEFAULT nextval('public.employee_history_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: recognitions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recognitions ALTER COLUMN id SET DEFAULT nextval('public.recognitions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name) FROM stdin;
3	RRHH
2	IT
1	Ventas
\.


--
-- Data for Name: employee_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_history (id, employee_id, field_changed, old_value, new_value, change_date) FROM stdin;
1	54	hire_date	Thu Feb 20 2020 00:00:00 GMT+0100 (hora estándar de Europa central)	2020-02-20	2025-03-07 14:47:56.30039
2	54	department_id	1	1	2025-03-07 14:47:56.303779
3	54	role_id	5	5	2025-03-07 14:47:56.304163
4	54	hire_date	Thu Feb 20 2020 00:00:00 GMT+0100 (hora estándar de Europa central)	2020-02-20	2025-03-07 14:50:30.369605
5	54	department_id	1	1	2025-03-07 14:50:30.370456
6	54	role_id	5	8	2025-03-07 14:50:30.370867
7	54	hire_date	Thu Feb 20 2020 00:00:00 GMT+0100 (hora estándar de Europa central)	2020-02-20	2025-03-07 19:35:47.518555
8	54	department_id	1	1	2025-03-07 19:35:47.522158
9	54	role_id	8	9	2025-03-07 19:35:47.52262
10	54	hire_date	Thu Feb 20 2020 00:00:00 GMT+0100 (hora estándar de Europa central)	2020-02-20	2025-03-07 20:06:42.904863
11	54	department_id	1	2	2025-03-07 20:06:42.906774
12	54	role_id	9	9	2025-03-07 20:06:42.907415
13	55	hire_date	Sun Oct 10 2010 00:00:00 GMT+0200 (hora de verano de Europa central)	2010-10-09	2025-03-07 20:30:12.000207
14	55	department_id	3	3	2025-03-07 20:30:12.002451
15	55	role_id	8	9	2025-03-07 20:30:12.002756
16	54	hire_date	Thu Feb 20 2020 00:00:00 GMT+0100 (hora estándar de Europa central)	2020-02-19	2025-03-07 21:04:06.510231
17	54	department_id	2	2	2025-03-07 21:04:06.513209
18	54	role_id	9	9	2025-03-07 21:04:06.513724
19	54	hire_date	Wed Feb 19 2020 00:00:00 GMT+0100 (hora estándar de Europa central)	2020-02-18	2025-03-07 21:04:19.099738
20	54	department_id	2	2	2025-03-07 21:04:19.100487
21	54	role_id	9	9	2025-03-07 21:04:19.101032
22	56	hire_date	Sun Oct 10 2010 00:00:00 GMT+0200 (hora de verano de Europa central)	2010-10-10	2025-03-07 21:25:24.106991
23	56	department_id	1	1	2025-03-07 21:25:24.108932
24	56	role_id	5	8	2025-03-07 21:25:24.109206
25	57	hire_date	Sun Oct 10 2010 00:00:00 GMT+0200 (hora de verano de Europa central)	2010-10-10	2025-03-07 21:56:36.567658
26	57	department_id	2	2	2025-03-07 21:56:36.569842
27	57	role_id	5	8	2025-03-07 21:56:36.570731
28	54	hire_date	Tue Feb 18 2020 00:00:00 GMT+0100 (hora estándar de Europa central)	2020-02-17	2025-03-07 22:37:09.915857
29	54	department_id	2	2	2025-03-07 22:37:09.918343
30	54	role_id	9	9	2025-03-07 22:37:09.918664
31	58	hire_date	Sun Oct 10 2010 00:00:00 GMT+0200 (hora de verano de Europa central)	2010-10-10	2025-03-08 00:46:36.452237
32	58	department_id	1	2	2025-03-08 00:46:36.453379
33	58	role_id	5	5	2025-03-08 00:46:36.454636
34	61	hire_date	Fri Jan 01 2010 00:00:00 GMT+0100 (hora estándar de Europa central)	2010-01-01	2025-03-08 18:51:19.859293
35	61	department_id	3	3	2025-03-08 18:51:19.862447
36	61	role_id	5	5	2025-03-08 18:51:19.863101
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, first_name, last_name, email, hire_date, department_id, role_id, is_active) FROM stdin;
58	ivan	Garcia	ivan@mail.es	2010-10-10	2	5	t
54	testcambio	testcambio	tester1@mail.es	2020-02-17	2	9	f
57	Liuda	Mare	liuda@mail.es	2010-10-10	2	8	t
60	Valentina	Car	valentina@mail.es	2025-01-01	2	8	t
61	Vitalii	Carabutttttttt	mail.es	2010-01-01	3	5	f
1	Admin	User	admin@example.com	2023-01-01	\N	\N	t
55	Juan	Garcia	jgarcia@mail.es	2010-10-09	3	9	t
56	Mihai	Andres	mihai@mail.es	2010-10-10	1	8	t
\.


--
-- Data for Name: recognitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recognitions (id, employee_id, message, badge, date) FROM stdin;
7	58	aaa	star	2025-03-14
8	57	aaa	star	2025-03-20
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, title, salary) FROM stdin;
5	Jefe	10.00
8	Desarrollador	30.00
9	Gerente	50.00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, employee_id, email, password, role, is_active, created_at) FROM stdin;
4	1	admin@example.com	$2b$10$M5rHXBvnvu7ZdRbA/PgOVepoT8WbcL1HzgA7QmRjEi.zbOwImwv.S	admin	t	2025-03-08 19:39:17.665664
\.


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 8, true);


--
-- Name: employee_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_history_id_seq', 36, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 61, true);


--
-- Name: recognitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recognitions_id_seq', 10, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 12, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employee_history employee_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_history
    ADD CONSTRAINT employee_history_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: recognitions recognitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: employee_history employee_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_history
    ADD CONSTRAINT employee_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: employees employees_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: recognitions recognitions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: users users_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

