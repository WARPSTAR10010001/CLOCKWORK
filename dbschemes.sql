--
-- PostgreSQL database dump
--

\restrict Bz3edrXnJmQklv1mHv7z1Gwwcstu3Yicv9cBMESxW5rrfHlbZJmDauvQzUgmSKi

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-03-18 17:05:28

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 238 (class 1255 OID 16385)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 16386)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16394)
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 220
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- TOC entry 221 (class 1259 OID 16395)
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    department_id integer,
    display_name text NOT NULL,
    start_month date NOT NULL,
    end_month date,
    annual_leave_days integer DEFAULT 30,
    carryover_days integer DEFAULT 0,
    is_active boolean DEFAULT true
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16406)
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 222
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- TOC entry 223 (class 1259 OID 16407)
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    id bigint NOT NULL,
    author_id integer,
    author_username text NOT NULL,
    category text NOT NULL,
    content text NOT NULL,
    app_version text,
    status text DEFAULT 'neu'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feedback_category_check CHECK ((category = ANY (ARRAY['Verbesserungsvorschlag'::text, 'Featureanfrage'::text, 'Visuelle- und/oder Logikfehler'::text, 'Lob'::text, 'Anderes'::text]))),
    CONSTRAINT feedback_status_check CHECK ((status = ANY (ARRAY['neu'::text, 'gelesen'::text, 'bearbeitet'::text])))
);


ALTER TABLE public.feedback OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16422)
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_id_seq OWNER TO postgres;

--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 224
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- TOC entry 225 (class 1259 OID 16423)
-- Name: holidays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.holidays (
    id integer NOT NULL,
    date date NOT NULL,
    name text NOT NULL,
    year integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.holidays OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16434)
-- Name: holidays_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.holidays_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.holidays_id_seq OWNER TO postgres;

--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 226
-- Name: holidays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.holidays_id_seq OWNED BY public.holidays.id;


--
-- TOC entry 227 (class 1259 OID 16435)
-- Name: plan_employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_employees (
    id integer NOT NULL,
    plan_id integer,
    employee_id integer,
    start_month date NOT NULL,
    end_month date,
    initial_balance integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.plan_employees OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16442)
-- Name: plan_employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plan_employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plan_employees_id_seq OWNER TO postgres;

--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 228
-- Name: plan_employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plan_employees_id_seq OWNED BY public.plan_employees.id;


--
-- TOC entry 229 (class 1259 OID 16443)
-- Name: plan_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_entries (
    id integer NOT NULL,
    plan_id integer,
    department_id integer,
    employee_id integer,
    entry_date date NOT NULL,
    status text NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    CONSTRAINT plan_entries_status_check CHECK ((status = ANY (ARRAY['PRESENCE'::text, 'HOME'::text, 'VACATION'::text, 'SICK'::text, 'TRAINING'::text, 'FLEXTIME'::text, 'OTHER'::text, 'APPOINTMENT'::text])))
);


ALTER TABLE public.plan_entries OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16455)
-- Name: plan_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plan_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plan_entries_id_seq OWNER TO postgres;

--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 230
-- Name: plan_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plan_entries_id_seq OWNED BY public.plan_entries.id;


--
-- TOC entry 231 (class 1259 OID 16456)
-- Name: plan_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_logs (
    id integer NOT NULL,
    plan_id integer NOT NULL,
    department_id integer NOT NULL,
    employee_id integer NOT NULL,
    action_type text NOT NULL,
    status_code text,
    date_from date NOT NULL,
    date_to date NOT NULL,
    day_count integer NOT NULL,
    dates date[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    note_before text,
    note_after text
);


ALTER TABLE public.plan_logs OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16472)
-- Name: plan_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plan_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plan_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 232
-- Name: plan_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plan_logs_id_seq OWNED BY public.plan_logs.id;


--
-- TOC entry 233 (class 1259 OID 16473)
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    id integer NOT NULL,
    department_id integer,
    year integer NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16479)
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plans_id_seq OWNER TO postgres;

--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 234
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- TOC entry 235 (class 1259 OID 16480)
-- Name: system_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_users (
    id integer NOT NULL,
    department_id integer,
    username text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password_reset boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    CONSTRAINT system_users_role_check CHECK ((role = ANY (ARRAY['ADMIN'::text, 'MOD'::text, 'USER'::text])))
);


ALTER TABLE public.system_users OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16494)
-- Name: system_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_users_id_seq OWNER TO postgres;

--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 236
-- Name: system_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_users_id_seq OWNED BY public.system_users.id;


--
-- TOC entry 237 (class 1259 OID 16495)
-- Name: v_vacation_usage; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_vacation_usage AS
 SELECT plan_id,
    employee_id,
    (EXTRACT(year FROM entry_date))::integer AS year,
    (count(*) FILTER (WHERE (status = 'VACATION'::text)))::integer AS used_days
   FROM public.plan_entries pe
  GROUP BY plan_id, employee_id, (EXTRACT(year FROM entry_date));


ALTER VIEW public.v_vacation_usage OWNER TO postgres;

--
-- TOC entry 4901 (class 2604 OID 16499)
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 4903 (class 2604 OID 16500)
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- TOC entry 4907 (class 2604 OID 16501)
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 16502)
-- Name: holidays id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays ALTER COLUMN id SET DEFAULT nextval('public.holidays_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 16503)
-- Name: plan_employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_employees ALTER COLUMN id SET DEFAULT nextval('public.plan_employees_id_seq'::regclass);


--
-- TOC entry 4914 (class 2604 OID 16504)
-- Name: plan_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_entries ALTER COLUMN id SET DEFAULT nextval('public.plan_entries_id_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 16505)
-- Name: plan_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_logs ALTER COLUMN id SET DEFAULT nextval('public.plan_logs_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 16506)
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 16507)
-- Name: system_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_users ALTER COLUMN id SET DEFAULT nextval('public.system_users_id_seq'::regclass);


--
-- TOC entry 4930 (class 2606 OID 16509)
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- TOC entry 4932 (class 2606 OID 16511)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 4934 (class 2606 OID 16513)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 4936 (class 2606 OID 16515)
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- TOC entry 4940 (class 2606 OID 16517)
-- Name: holidays holidays_date_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_date_unique UNIQUE (date);


--
-- TOC entry 4942 (class 2606 OID 16519)
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- TOC entry 4945 (class 2606 OID 16521)
-- Name: plan_employees plan_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_employees
    ADD CONSTRAINT plan_employees_pkey PRIMARY KEY (id);


--
-- TOC entry 4947 (class 2606 OID 16523)
-- Name: plan_employees plan_employees_plan_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_employees
    ADD CONSTRAINT plan_employees_plan_id_employee_id_key UNIQUE (plan_id, employee_id);


--
-- TOC entry 4950 (class 2606 OID 16525)
-- Name: plan_entries plan_entries_employee_id_entry_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_entries
    ADD CONSTRAINT plan_entries_employee_id_entry_date_key UNIQUE (employee_id, entry_date);


--
-- TOC entry 4952 (class 2606 OID 16527)
-- Name: plan_entries plan_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_entries
    ADD CONSTRAINT plan_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4956 (class 2606 OID 16529)
-- Name: plan_logs plan_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_logs
    ADD CONSTRAINT plan_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4959 (class 2606 OID 16531)
-- Name: plans plans_department_id_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_department_id_year_key UNIQUE (department_id, year);


--
-- TOC entry 4961 (class 2606 OID 16533)
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- TOC entry 4964 (class 2606 OID 16535)
-- Name: system_users system_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_users
    ADD CONSTRAINT system_users_pkey PRIMARY KEY (id);


--
-- TOC entry 4966 (class 2606 OID 16537)
-- Name: system_users system_users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_users
    ADD CONSTRAINT system_users_username_key UNIQUE (username);


--
-- TOC entry 4954 (class 2606 OID 16539)
-- Name: plan_entries uq_plan_entries_employee_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_entries
    ADD CONSTRAINT uq_plan_entries_employee_date UNIQUE (employee_id, entry_date);


--
-- TOC entry 4937 (class 1259 OID 16540)
-- Name: idx_feedback_author_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedback_author_created_at ON public.feedback USING btree (author_id, created_at DESC);


--
-- TOC entry 4938 (class 1259 OID 16541)
-- Name: idx_feedback_status_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedback_status_created_at ON public.feedback USING btree (status, created_at DESC);


--
-- TOC entry 4943 (class 1259 OID 16542)
-- Name: idx_holidays_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_holidays_year ON public.holidays USING btree (year);


--
-- TOC entry 4948 (class 1259 OID 16543)
-- Name: idx_plan_entries_emp_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plan_entries_emp_date ON public.plan_entries USING btree (employee_id, entry_date);


--
-- TOC entry 4962 (class 1259 OID 16544)
-- Name: idx_system_users_last_login_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_users_last_login_at ON public.system_users USING btree (last_login_at);


--
-- TOC entry 4957 (class 1259 OID 16545)
-- Name: plan_logs_plan_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plan_logs_plan_id_created_at_idx ON public.plan_logs USING btree (plan_id, created_at DESC);


--
-- TOC entry 4981 (class 2620 OID 16546)
-- Name: plan_entries trg_plan_entries_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_plan_entries_updated_at BEFORE UPDATE ON public.plan_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4967 (class 2606 OID 16547)
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- TOC entry 4968 (class 2606 OID 16552)
-- Name: feedback feedback_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.system_users(id) ON DELETE SET NULL;


--
-- TOC entry 4969 (class 2606 OID 16557)
-- Name: plan_employees plan_employees_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_employees
    ADD CONSTRAINT plan_employees_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 4970 (class 2606 OID 16562)
-- Name: plan_employees plan_employees_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_employees
    ADD CONSTRAINT plan_employees_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- TOC entry 4971 (class 2606 OID 16567)
-- Name: plan_entries plan_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_entries
    ADD CONSTRAINT plan_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.system_users(id) ON DELETE SET NULL;


--
-- TOC entry 4972 (class 2606 OID 16572)
-- Name: plan_entries plan_entries_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_entries
    ADD CONSTRAINT plan_entries_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- TOC entry 4973 (class 2606 OID 16577)
-- Name: plan_entries plan_entries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_entries
    ADD CONSTRAINT plan_entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 4974 (class 2606 OID 16582)
-- Name: plan_entries plan_entries_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_entries
    ADD CONSTRAINT plan_entries_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- TOC entry 4975 (class 2606 OID 16587)
-- Name: plan_logs plan_logs_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_logs
    ADD CONSTRAINT plan_logs_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- TOC entry 4976 (class 2606 OID 16592)
-- Name: plan_logs plan_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_logs
    ADD CONSTRAINT plan_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 4977 (class 2606 OID 16597)
-- Name: plan_logs plan_logs_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_logs
    ADD CONSTRAINT plan_logs_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- TOC entry 4978 (class 2606 OID 16602)
-- Name: plans plans_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.system_users(id) ON DELETE SET NULL;


--
-- TOC entry 4979 (class 2606 OID 16607)
-- Name: plans plans_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- TOC entry 4980 (class 2606 OID 16612)
-- Name: system_users system_users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_users
    ADD CONSTRAINT system_users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


-- Completed on 2026-03-18 17:05:28

--
-- PostgreSQL database dump complete
--

\unrestrict Bz3edrXnJmQklv1mHv7z1Gwwcstu3Yicv9cBMESxW5rrfHlbZJmDauvQzUgmSKi

