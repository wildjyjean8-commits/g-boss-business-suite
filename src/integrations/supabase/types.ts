export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          sector: string
          plan: string
          currency: string
          exchange_rate: number
          pos_enabled: boolean
          stock_enabled: boolean
          hotel_addon: boolean
          school_addon: boolean
          tax_rate: number
          status: string
          trial_ends_at: string | null
          paid_on_time: boolean
          legal_name: string | null
          address: string | null
          phone: string | null
          email: string | null
          tax_number: string | null
          logo_url: string | null
          kyc_status: string
          subscription_paid_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          sector: string
          plan: string
          currency?: string
          exchange_rate?: number
          pos_enabled?: boolean
          stock_enabled?: boolean
          hotel_addon?: boolean
          school_addon?: boolean
          tax_rate?: number
          status?: string
          trial_ends_at?: string | null
          paid_on_time?: boolean
          legal_name?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          tax_number?: string | null
          logo_url?: string | null
          kyc_status?: string
          subscription_paid_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          sector?: string
          plan?: string
          currency?: string
          exchange_rate?: number
          pos_enabled?: boolean
          stock_enabled?: boolean
          hotel_addon?: boolean
          school_addon?: boolean
          tax_rate?: number
          status?: string
          trial_ends_at?: string | null
          paid_on_time?: boolean
          legal_name?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          tax_number?: string | null
          logo_url?: string | null
          kyc_status?: string
          subscription_paid_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_kyc_submissions: {
        Row: {
          id: string
          business_id: string
          id_document_url: string
          selfie_url: string
          document_type: string
          status: string
          rejection_reason: string | null
          submitted_by: string
          submitted_at: string
          reviewed_by: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          business_id: string
          id_document_url: string
          selfie_url: string
          document_type?: string
          status?: string
          rejection_reason?: string | null
          submitted_by: string
          submitted_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          id_document_url?: string
          selfie_url?: string
          document_type?: string
          status?: string
          rejection_reason?: string | null
          submitted_by?: string
          submitted_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_kyc_submissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          id: string
          business_id: string
          user_id: string | null
          name: string
          role: string
          department: string | null
          phone: string | null
          salary: number | null
          active: boolean
          present: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id?: string | null
          name: string
          role: string
          department?: string | null
          phone?: string | null
          salary?: number | null
          active?: boolean
          present?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string | null
          name?: string
          role?: string
          department?: string | null
          phone?: string | null
          salary?: number | null
          active?: boolean
          present?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          business_id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          id: string
          email: string
          code_hash: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          code_hash: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          code_hash?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          business_id: string
          category: string | null
          description: string | null
          amount: number
          occurred_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          business_id: string
          category?: string | null
          description?: string | null
          amount?: number
          occurred_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          category?: string | null
          description?: string | null
          amount?: number
          occurred_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      hotel_reservations: {
        Row: {
          id: string
          business_id: string
          unit_id: string
          guest_name: string
          guest_id_number: string | null
          nationality: string | null
          adults: number
          children: number
          checkin: string
          checkout: string
          amount_paid: number
          agreed_damage_policy: boolean
          agreed_noise_policy: boolean
          id_document_photo_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          unit_id: string
          guest_name: string
          guest_id_number?: string | null
          nationality?: string | null
          adults?: number
          children?: number
          checkin: string
          checkout: string
          amount_paid?: number
          agreed_damage_policy?: boolean
          agreed_noise_policy?: boolean
          id_document_photo_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          unit_id?: string
          guest_name?: string
          guest_id_number?: string | null
          nationality?: string | null
          adults?: number
          children?: number
          checkin?: string
          checkout?: string
          amount_paid?: number
          agreed_damage_policy?: boolean
          agreed_noise_policy?: boolean
          id_document_photo_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotel_units: {
        Row: {
          id: string
          business_id: string
          label: string
          number: string
          type: string
          bedrooms: number
          living_room: boolean
          kitchen: boolean
          bathrooms: number
          capacity: number
          amenities: string[]
          price_per_night: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          label: string
          number: string
          type: string
          bedrooms?: number
          living_room?: boolean
          kitchen?: boolean
          bathrooms?: number
          capacity?: number
          amenities?: string[]
          price_per_night?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          label?: string
          number?: string
          type?: string
          bedrooms?: number
          living_room?: boolean
          kitchen?: boolean
          bathrooms?: number
          capacity?: number
          amenities?: string[]
          price_per_night?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          business_id: string
          reference: string
          client: string
          amount: number
          status: string
          issue_date: string
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          reference: string
          client: string
          amount?: number
          status?: string
          issue_date?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          reference?: string
          client?: string
          amount?: number
          status?: string
          issue_date?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ledger_accounts: {
        Row: {
          id: string
          business_id: string
          name: string
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_purchases: {
        Row: {
          id: string
          business_id: string
          supplier_id: string
          description: string | null
          amount: number
          purchase_date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          supplier_id: string
          description?: string | null
          amount: number
          purchase_date?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          supplier_id?: string
          description?: string | null
          amount?: number
          purchase_date?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      salary_payments: {
        Row: {
          id: string
          business_id: string
          member_id: string
          amount: number
          pay_date: string
          period_label: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          member_id: string
          amount: number
          pay_date?: string
          period_label?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          member_id?: string
          amount?: number
          pay_date?: string
          period_label?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      owner_equity_entries: {
        Row: {
          id: string
          business_id: string
          kind: string
          amount: number
          entry_date: string
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          kind: string
          amount: number
          entry_date?: string
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          kind?: string
          amount?: number
          entry_date?: string
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      liabilities: {
        Row: {
          id: string
          business_id: string
          kind: string
          creditor: string
          amount: number
          status: string
          due_date: string | null
          note: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          kind: string
          creditor: string
          amount: number
          status?: string
          due_date?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          kind?: string
          creditor?: string
          amount?: number
          status?: string
          due_date?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_runs: {
        Row: {
          id: string
          business_id: string
          period_label: string
          period_start: string
          period_end: string
          status: string
          total_amount: number
          processed_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          period_label: string
          period_start: string
          period_end: string
          status?: string
          total_amount?: number
          processed_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          period_label?: string
          period_start?: string
          period_end?: string
          status?: string
          total_amount?: number
          processed_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      payroll_run_items: {
        Row: {
          id: string
          payroll_run_id: string
          business_id: string
          member_id: string | null
          member_name: string
          salary: number
          created_at: string
        }
        Insert: {
          id?: string
          payroll_run_id: string
          business_id: string
          member_id?: string | null
          member_name: string
          salary?: number
          created_at?: string
        }
        Update: {
          id?: string
          payroll_run_id?: string
          business_id?: string
          member_id?: string | null
          member_name?: string
          salary?: number
          created_at?: string
        }
        Relationships: []
      }
      moncash_transactions: {
        Row: {
          id: string
          business_id: string | null
          order_id: string
          moncash_transaction_id: string | null
          amount: number
          currency: string
          status: string
          purpose: string
          reference_id: string | null
          raw_response: Json | null
          created_at: string
          confirmed_at: string | null
        }
        Insert: {
          id?: string
          business_id?: string | null
          order_id: string
          moncash_transaction_id?: string | null
          amount?: number
          currency?: string
          status?: string
          purpose?: string
          reference_id?: string | null
          raw_response?: Json | null
          created_at?: string
          confirmed_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string | null
          order_id?: string
          moncash_transaction_id?: string | null
          amount?: number
          currency?: string
          status?: string
          purpose?: string
          reference_id?: string | null
          raw_response?: Json | null
          created_at?: string
          confirmed_at?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          id: string
          business_id: string
          kind: string
          reference: string
          party: string | null
          account_id: string | null
          amount: number
          receipt_date: string
          file_url: string | null
          source: string
          source_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          kind: string
          reference: string
          party?: string | null
          account_id?: string | null
          amount?: number
          receipt_date?: string
          file_url?: string | null
          source?: string
          source_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          kind?: string
          reference?: string
          party?: string | null
          account_id?: string | null
          amount?: number
          receipt_date?: string
          file_url?: string | null
          source?: string
          source_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          business_id: string
          sku: string
          name: string
          category: string | null
          price: number
          cost: number
          stock: number
          min_stock: number
          supplier_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          sku: string
          name: string
          category?: string | null
          price?: number
          cost?: number
          stock?: number
          min_stock?: number
          supplier_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          sku?: string
          name?: string
          category?: string | null
          price?: number
          cost?: number
          stock?: number
          min_stock?: number
          supplier_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          preferred_language: string
          is_super_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          preferred_language?: string
          is_super_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          preferred_language?: string
          is_super_admin?: boolean
          created_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          sale_id: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          business_id: string
          occurred_at: string
          payment_method: string | null
          subtotal: number
          tax_amount: number
          total: number
          created_by: string | null
        }
        Insert: {
          id?: string
          business_id: string
          occurred_at?: string
          payment_method?: string | null
          subtotal?: number
          tax_amount?: number
          total?: number
          created_by?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          occurred_at?: string
          payment_method?: string | null
          subtotal?: number
          tax_amount?: number
          total?: number
          created_by?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          id: string
          business_id: string
          name: string
          classroom: string | null
          average: number | null
          attendance: number | null
          status: string
          guardian: string | null
          guardian_user_id: string | null
          student_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          classroom?: string | null
          average?: number | null
          attendance?: number | null
          status?: string
          guardian?: string | null
          guardian_user_id?: string | null
          student_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          classroom?: string | null
          average?: number | null
          attendance?: number | null
          status?: string
          guardian?: string | null
          guardian_user_id?: string | null
          student_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_grades: {
        Row: {
          id: string
          business_id: string
          student_id: string
          subject: string
          period: string
          grade: number
          max_grade: number
          comment: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          student_id: string
          subject: string
          period: string
          grade: number
          max_grade?: number
          comment?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          student_id?: string
          subject?: string
          period?: string
          grade?: number
          max_grade?: number
          comment?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      student_attendance: {
        Row: {
          id: string
          business_id: string
          student_id: string
          attended_on: string
          present: boolean
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          student_id: string
          attended_on?: string
          present?: boolean
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          student_id?: string
          attended_on?: string
          present?: boolean
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      student_payments: {
        Row: {
          id: string
          business_id: string
          student_id: string
          label: string
          amount_due: number
          amount_paid: number
          due_date: string | null
          paid_at: string | null
          status: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          student_id: string
          label: string
          amount_due?: number
          amount_paid?: number
          due_date?: string | null
          paid_at?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          student_id?: string
          label?: string
          amount_due?: number
          amount_paid?: number
          due_date?: string | null
          paid_at?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          id: string
          business_id: string
          amount: number
          currency: string
          paid_on_time: boolean
          period_start: string
          period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          amount: number
          currency?: string
          paid_on_time?: boolean
          period_start: string
          period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          amount?: number
          currency?: string
          paid_on_time?: boolean
          period_start?: string
          period_end?: string
          created_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          business_id: string
          name: string
          category: string | null
          contact: string | null
          rating: number | null
          on_gboss: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          category?: string | null
          contact?: string | null
          rating?: number | null
          on_gboss?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          category?: string | null
          contact?: string | null
          rating?: number | null
          on_gboss?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          business_id: string
          title: string
          description: string | null
          status: string
          priority: string
          assignee_id: string | null
          due_date: string | null
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          assignee_id?: string | null
          due_date?: string | null
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          assignee_id?: string | null
          due_date?: string | null
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_employee_performance: {
        Row: {
          member_id: string | null
          business_id: string | null
          name: string | null
          tasks_done: number | null
          tasks_total: number | null
        }
        Relationships: []
      }
      v_invoice_metrics: {
        Row: {
          business_id: string | null
          total: number | null
          paid: number | null
          pending: number | null
          expired: number | null
          month: number | null
        }
        Relationships: []
      }
      v_platform_growth: {
        Row: {
          month: string | null
          new_accounts: number | null
          revenue: number | null
        }
        Relationships: []
      }
      v_stock_metrics: {
        Row: {
          business_id: string | null
          value: number | null
          retail: number | null
          units: number | null
          total: number | null
          crit_count: number | null
          low_count: number | null
        }
        Relationships: []
      }
      v_task_metrics: {
        Row: {
          business_id: string | null
          total: number | null
          todo: number | null
          doing: number | null
          review: number | null
          blocked: number | null
          done: number | null
          unassigned: number | null
        }
        Relationships: []
      }
      v_week_metrics: {
        Row: {
          business_id: string | null
          day: string | null
          revenue: number | null
          expense: number | null
          orders: number | null
        }
        Relationships: []
      }
      v_student_payment_summary: {
        Row: {
          business_id: string | null
          total_items: number | null
          total_due: number | null
          total_paid: number | null
          total_outstanding: number | null
        }
        Relationships: []
      }
      v_balance_sheet: {
        Row: {
          business_id: string | null
          kach: number | null
          kont_pou_resevwa: number | null
          valè_estòk: number | null
          pasif_total: number | null
          kapital_enjekte: number | null
          tirad_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_business_member: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_student_or_guardian: {
        Args: { p_student_id: string }
        Returns: boolean
      }
      create_payroll_run: {
        Args: {
          p_business_id: string
          p_period_label: string
          p_period_start: string
          p_period_end: string
        }
        Returns: string
      }
      process_payroll_run: {
        Args: { p_run_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
