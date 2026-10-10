export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      booking_number_counter: {
        Row: {
          id: number;
          last: number;
        };
        Insert: {
          id: number;
          last: number;
        };
        Update: {
          id?: number;
          last?: number;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          amount: number | null;
          cancelled_at: string | null;
          cancelled_by: Database['public']['Enums']['cancelled_by'] | null;
          completed_at: string | null;
          created_at: string;
          expired_at: string | null;
          id: string;
          kind: Database['public']['Enums']['listing_kind'];
          listing_id: string;
          number: string;
          quantity: number;
          status: Database['public']['Enums']['booking_status'];
          store_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount?: number | null;
          cancelled_at?: string | null;
          cancelled_by?: Database['public']['Enums']['cancelled_by'] | null;
          completed_at?: string | null;
          created_at?: string;
          expired_at?: string | null;
          id?: string;
          kind: Database['public']['Enums']['listing_kind'];
          listing_id: string;
          number: string;
          quantity: number;
          status?: Database['public']['Enums']['booking_status'];
          store_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number | null;
          cancelled_at?: string | null;
          cancelled_by?: Database['public']['Enums']['cancelled_by'] | null;
          completed_at?: string | null;
          created_at?: string;
          expired_at?: string | null;
          id?: string;
          kind?: Database['public']['Enums']['listing_kind'];
          listing_id?: string;
          number?: string;
          quantity?: number;
          status?: Database['public']['Enums']['booking_status'];
          store_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listing_availability';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      listings: {
        Row: {
          application_deadline: string | null;
          body: string | null;
          booking_deadline: string | null;
          cancel_deadline: string | null;
          capacity: number | null;
          category: Database['public']['Enums']['product_category'] | null;
          conditions: string | null;
          created_at: string;
          ended_at: string | null;
          event_end: string | null;
          event_start: string | null;
          food_label: string | null;
          headcount: number | null;
          id: string;
          kind: Database['public']['Enums']['listing_kind'];
          max_per_booking: number | null;
          notify_on_publish: boolean;
          original_price: number | null;
          pay_amount: number | null;
          pay_text: string | null;
          pay_unit: Database['public']['Enums']['pay_unit'] | null;
          photo_url: string | null;
          pickup_end: string | null;
          pickup_start: string | null;
          place_address: string | null;
          place_name: string | null;
          price: number | null;
          price_per_person: number | null;
          publish_end: string;
          publish_notified_at: string | null;
          publish_start: string;
          quantity_total: number | null;
          status: Database['public']['Enums']['listing_status'];
          store_id: string;
          title: string;
          unit: string;
          updated_at: string;
          work_end: string | null;
          work_start: string | null;
          work_text: string | null;
          booking_expires_at: string | null;
          listing_schedule_end: string | null;
          listing_schedule_start: string | null;
        };
        Insert: {
          application_deadline?: string | null;
          body?: string | null;
          booking_deadline?: string | null;
          cancel_deadline?: string | null;
          capacity?: number | null;
          category?: Database['public']['Enums']['product_category'] | null;
          conditions?: string | null;
          created_at?: string;
          ended_at?: string | null;
          event_end?: string | null;
          event_start?: string | null;
          food_label?: string | null;
          headcount?: number | null;
          id?: string;
          kind: Database['public']['Enums']['listing_kind'];
          max_per_booking?: number | null;
          notify_on_publish?: boolean;
          original_price?: number | null;
          pay_amount?: number | null;
          pay_text?: string | null;
          pay_unit?: Database['public']['Enums']['pay_unit'] | null;
          photo_url?: string | null;
          pickup_end?: string | null;
          pickup_start?: string | null;
          place_address?: string | null;
          place_name?: string | null;
          price?: number | null;
          price_per_person?: number | null;
          publish_end: string;
          publish_notified_at?: string | null;
          publish_start: string;
          quantity_total?: number | null;
          status?: Database['public']['Enums']['listing_status'];
          store_id: string;
          title: string;
          unit?: string;
          updated_at?: string;
          work_end?: string | null;
          work_start?: string | null;
          work_text?: string | null;
        };
        Update: {
          application_deadline?: string | null;
          body?: string | null;
          booking_deadline?: string | null;
          cancel_deadline?: string | null;
          capacity?: number | null;
          category?: Database['public']['Enums']['product_category'] | null;
          conditions?: string | null;
          created_at?: string;
          ended_at?: string | null;
          event_end?: string | null;
          event_start?: string | null;
          food_label?: string | null;
          headcount?: number | null;
          id?: string;
          kind?: Database['public']['Enums']['listing_kind'];
          max_per_booking?: number | null;
          notify_on_publish?: boolean;
          original_price?: number | null;
          pay_amount?: number | null;
          pay_text?: string | null;
          pay_unit?: Database['public']['Enums']['pay_unit'] | null;
          photo_url?: string | null;
          pickup_end?: string | null;
          pickup_start?: string | null;
          place_address?: string | null;
          place_name?: string | null;
          price?: number | null;
          price_per_person?: number | null;
          publish_end?: string;
          publish_notified_at?: string | null;
          publish_start?: string;
          quantity_total?: number | null;
          status?: Database['public']['Enums']['listing_status'];
          store_id?: string;
          title?: string;
          unit?: string;
          updated_at?: string;
          work_end?: string | null;
          work_start?: string | null;
          work_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          attempts: number;
          body: string;
          booking_id: string | null;
          claimed_at: string | null;
          created_at: string;
          dedupe_key: string | null;
          email_error: string | null;
          email_sent_at: string | null;
          id: string;
          kind: Database['public']['Enums']['notification_kind'];
          listing_id: string | null;
          next_attempt_at: string | null;
          push_error: string | null;
          push_sent_at: string | null;
          push_ticket_id: string | null;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          body: string;
          booking_id?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          email_error?: string | null;
          email_sent_at?: string | null;
          id?: string;
          kind: Database['public']['Enums']['notification_kind'];
          listing_id?: string | null;
          next_attempt_at?: string | null;
          push_error?: string | null;
          push_sent_at?: string | null;
          push_ticket_id?: string | null;
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          attempts?: number;
          body?: string;
          booking_id?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          email_error?: string | null;
          email_sent_at?: string | null;
          id?: string;
          kind?: Database['public']['Enums']['notification_kind'];
          listing_id?: string | null;
          next_attempt_at?: string | null;
          push_error?: string | null;
          push_sent_at?: string | null;
          push_ticket_id?: string | null;
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'staff_booking_rows';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listing_availability';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          agreed_terms_at: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string;
          id: string;
          is_staff: boolean;
          name: string;
          notifications_enabled: boolean;
          pending_email: string | null;
          phone: string;
          updated_at: string;
        };
        Insert: {
          agreed_terms_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          id: string;
          is_staff?: boolean;
          name?: string;
          notifications_enabled?: boolean;
          pending_email?: string | null;
          phone?: string;
          updated_at?: string;
        };
        Update: {
          agreed_terms_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          id?: string;
          is_staff?: boolean;
          name?: string;
          notifications_enabled?: boolean;
          pending_email?: string | null;
          phone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_tickets: {
        Row: {
          created_at: string;
          notification_id: string;
          ticket_id: string;
          token: string;
        };
        Insert: {
          created_at?: string;
          notification_id: string;
          ticket_id: string;
          token: string;
        };
        Update: {
          created_at?: string;
          notification_id?: string;
          ticket_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_tickets_notification_id_fkey';
            columns: ['notification_id'];
            isOneToOne: false;
            referencedRelation: 'notifications';
            referencedColumns: ['id'];
          },
        ];
      };
      push_tokens: {
        Row: {
          created_at: string;
          disabled_at: string | null;
          id: string;
          last_error: string | null;
          platform: string;
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          disabled_at?: string | null;
          id?: string;
          last_error?: string | null;
          platform: string;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          disabled_at?: string | null;
          id?: string;
          last_error?: string | null;
          platform?: string;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_tokens_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      store_staff: {
        Row: {
          created_at: string;
          store_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          store_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          store_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_staff_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'store_staff_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      stores: {
        Row: {
          address: string;
          created_at: string;
          hours_text: string | null;
          id: string;
          name: string;
          payment_methods: Database['public']['Enums']['payment_method'][];
          phone: string;
          updated_at: string;
        };
        Insert: {
          address: string;
          created_at?: string;
          hours_text?: string | null;
          id?: string;
          name: string;
          payment_methods: Database['public']['Enums']['payment_method'][];
          phone: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          created_at?: string;
          hours_text?: string | null;
          id?: string;
          name?: string;
          payment_methods?: Database['public']['Enums']['payment_method'][];
          phone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      listing_availability: {
        Row: {
          application_deadline: string | null;
          body: string | null;
          booking_deadline: string | null;
          cancel_deadline: string | null;
          capacity: number | null;
          category: Database['public']['Enums']['product_category'] | null;
          conditions: string | null;
          created_at: string | null;
          display_status: string | null;
          ended_at: string | null;
          event_end: string | null;
          event_start: string | null;
          food_label: string | null;
          headcount: number | null;
          id: string | null;
          kind: Database['public']['Enums']['listing_kind'] | null;
          max_per_booking: number | null;
          notify_on_publish: boolean | null;
          original_price: number | null;
          pay_amount: number | null;
          pay_text: string | null;
          pay_unit: Database['public']['Enums']['pay_unit'] | null;
          photo_url: string | null;
          pickup_end: string | null;
          pickup_start: string | null;
          place_address: string | null;
          place_name: string | null;
          price: number | null;
          price_per_person: number | null;
          publish_end: string | null;
          publish_start: string | null;
          quantity_total: number | null;
          remaining: number | null;
          reserved_quantity: number | null;
          status: Database['public']['Enums']['listing_status'] | null;
          store_id: string | null;
          title: string | null;
          unit: string | null;
          updated_at: string | null;
          work_end: string | null;
          work_start: string | null;
          work_text: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      staff_booking_rows: {
        Row: {
          amount: number | null;
          cancelled_at: string | null;
          cancelled_by: Database['public']['Enums']['cancelled_by'] | null;
          completed_at: string | null;
          created_at: string | null;
          customer_deleted: boolean | null;
          customer_name: string | null;
          customer_phone: string | null;
          expired_at: string | null;
          expires_at: string | null;
          id: string | null;
          kind: Database['public']['Enums']['listing_kind'] | null;
          listing_id: string | null;
          listing_pay_text: string | null;
          listing_place_name: string | null;
          listing_title: string | null;
          listing_unit: string | null;
          listing_work_text: string | null;
          number: string | null;
          quantity: number | null;
          schedule_end: string | null;
          schedule_start: string | null;
          status: Database['public']['Enums']['booking_status'] | null;
          store_id: string | null;
          store_name: string | null;
          store_payment_methods: Database['public']['Enums']['payment_method'][] | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listing_availability';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      booking_expires_at: {
        Args: { p_listing: Database['public']['Tables']['listings']['Row'] };
        Returns: string;
      };
      cancel_booking: {
        Args: { p_booking_id: string };
        Returns: {
          amount: number | null;
          cancelled_at: string | null;
          cancelled_by: Database['public']['Enums']['cancelled_by'] | null;
          completed_at: string | null;
          created_at: string;
          expired_at: string | null;
          id: string;
          kind: Database['public']['Enums']['listing_kind'];
          listing_id: string;
          number: string;
          quantity: number;
          status: Database['public']['Enums']['booking_status'];
          store_id: string;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      claim_notifications: {
        Args: { p_limit?: number };
        Returns: {
          attempts: number;
          body: string;
          booking_id: string | null;
          claimed_at: string | null;
          created_at: string;
          dedupe_key: string | null;
          email_error: string | null;
          email_sent_at: string | null;
          id: string;
          kind: Database['public']['Enums']['notification_kind'];
          listing_id: string | null;
          next_attempt_at: string | null;
          push_error: string | null;
          push_sent_at: string | null;
          push_ticket_id: string | null;
          read_at: string | null;
          title: string;
          user_id: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'notifications';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      complete_booking: {
        Args: { p_booking_id: string };
        Returns: {
          amount: number | null;
          cancelled_at: string | null;
          cancelled_by: Database['public']['Enums']['cancelled_by'] | null;
          completed_at: string | null;
          created_at: string;
          expired_at: string | null;
          id: string;
          kind: Database['public']['Enums']['listing_kind'];
          listing_id: string;
          number: string;
          quantity: number;
          status: Database['public']['Enums']['booking_status'];
          store_id: string;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_booking: {
        Args: { p_listing_id: string; p_quantity: number };
        Returns: {
          amount: number | null;
          cancelled_at: string | null;
          cancelled_by: Database['public']['Enums']['cancelled_by'] | null;
          completed_at: string | null;
          created_at: string;
          expired_at: string | null;
          id: string;
          kind: Database['public']['Enums']['listing_kind'];
          listing_id: string;
          number: string;
          quantity: number;
          status: Database['public']['Enums']['booking_status'];
          store_id: string;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_store: {
        Args: {
          p_address: string;
          p_hours_text: string;
          p_name: string;
          p_payment_methods: Database['public']['Enums']['payment_method'][];
          p_phone: string;
        };
        Returns: {
          address: string;
          created_at: string;
          hours_text: string | null;
          id: string;
          name: string;
          payment_methods: Database['public']['Enums']['payment_method'][];
          phone: string;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'stores';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      emit_publish_notifications: { Args: Record<PropertyKey, never>; Returns: number };
      emit_reminders: { Args: { p_which: string }; Returns: number };
      end_listing: {
        Args: { p_listing_id: string };
        Returns: {
          application_deadline: string | null;
          body: string | null;
          booking_deadline: string | null;
          cancel_deadline: string | null;
          capacity: number | null;
          category: Database['public']['Enums']['product_category'] | null;
          conditions: string | null;
          created_at: string;
          ended_at: string | null;
          event_end: string | null;
          event_start: string | null;
          food_label: string | null;
          headcount: number | null;
          id: string;
          kind: Database['public']['Enums']['listing_kind'];
          max_per_booking: number | null;
          notify_on_publish: boolean;
          original_price: number | null;
          pay_amount: number | null;
          pay_text: string | null;
          pay_unit: Database['public']['Enums']['pay_unit'] | null;
          photo_url: string | null;
          pickup_end: string | null;
          pickup_start: string | null;
          place_address: string | null;
          place_name: string | null;
          price: number | null;
          price_per_person: number | null;
          publish_end: string;
          publish_notified_at: string | null;
          publish_start: string;
          quantity_total: number | null;
          status: Database['public']['Enums']['listing_status'];
          store_id: string;
          title: string;
          unit: string;
          updated_at: string;
          work_end: string | null;
          work_start: string | null;
          work_text: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'listings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      expire_overdue_bookings: { Args: Record<PropertyKey, never>; Returns: number };
      invoke_send_notifications: { Args: Record<PropertyKey, never>; Returns: number };
      is_store_staff: { Args: { p_store_id: string }; Returns: boolean };
      jst_today_start: { Args: Record<PropertyKey, never>; Returns: string };
      listing_reserved_quantities: {
        Args: Record<PropertyKey, never>;
        Returns: {
          listing_id: string;
          reserved_quantity: number;
        }[];
      };
      listing_schedule_end: {
        Args: { p_listing: Database['public']['Tables']['listings']['Row'] };
        Returns: string;
      };
      listing_schedule_start: {
        Args: { p_listing: Database['public']['Tables']['listings']['Row'] };
        Returns: string;
      };
      next_booking_number: { Args: Record<PropertyKey, never>; Returns: string };
      notification_wants_email: {
        Args: { p_kind: Database['public']['Enums']['notification_kind'] };
        Returns: boolean;
      };
      register_push_token: { Args: { p_platform: string; p_token: string }; Returns: undefined };
      revert_booking: {
        Args: { p_booking_id: string };
        Returns: {
          amount: number | null;
          cancelled_at: string | null;
          cancelled_by: Database['public']['Enums']['cancelled_by'] | null;
          completed_at: string | null;
          created_at: string;
          expired_at: string | null;
          id: string;
          kind: Database['public']['Enums']['listing_kind'];
          listing_id: string;
          number: string;
          quantity: number;
          status: Database['public']['Enums']['booking_status'];
          store_id: string;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      staff_booking_guard: {
        Args: { p_booking_id: string };
        Returns: {
          amount: number | null;
          cancelled_at: string | null;
          cancelled_by: Database['public']['Enums']['cancelled_by'] | null;
          completed_at: string | null;
          created_at: string;
          expired_at: string | null;
          id: string;
          kind: Database['public']['Enums']['listing_kind'];
          listing_id: string;
          number: string;
          quantity: number;
          status: Database['public']['Enums']['booking_status'];
          store_id: string;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      staff_cancel_booking: {
        Args: { p_booking_id: string };
        Returns: {
          amount: number | null;
          cancelled_at: string | null;
          cancelled_by: Database['public']['Enums']['cancelled_by'] | null;
          completed_at: string | null;
          created_at: string;
          expired_at: string | null;
          id: string;
          kind: Database['public']['Enums']['listing_kind'];
          listing_id: string;
          number: string;
          quantity: number;
          status: Database['public']['Enums']['booking_status'];
          store_id: string;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      staff_store_summaries: {
        Args: Record<PropertyKey, never>;
        Returns: {
          address: string;
          draft_count: number;
          hours_text: string;
          name: string;
          payment_methods: Database['public']['Enums']['payment_method'][];
          phone: string;
          published_count: number;
          scheduled_count: number;
          store_id: string;
          today_count: number;
        }[];
      };
    };
    Enums: {
      booking_status: 'reserved' | 'completed' | 'cancelled' | 'expired';
      cancelled_by: 'user' | 'staff';
      listing_kind: 'product' | 'event' | 'job' | 'notice';
      listing_status: 'draft' | 'published' | 'ended';
      notification_kind:
        | 'booking_confirmed'
        | 'reminder'
        | 'cancelled_by_staff'
        | 'listing_changed'
        | 'notice_published'
        | 'listing_published';
      pay_unit: 'daily' | 'hourly';
      payment_method: 'cash' | 'paypay' | 'credit' | 'transit_ic' | 'other';
      product_category:
        'bento' | 'rice' | 'vegetable' | 'bread' | 'sweets' | 'processed' | 'laundry';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: ['reserved', 'completed', 'cancelled', 'expired'],
      cancelled_by: ['user', 'staff'],
      listing_kind: ['product', 'event', 'job', 'notice'],
      listing_status: ['draft', 'published', 'ended'],
      notification_kind: [
        'booking_confirmed',
        'reminder',
        'cancelled_by_staff',
        'listing_changed',
        'notice_published',
        'listing_published',
      ],
      pay_unit: ['daily', 'hourly'],
      payment_method: ['cash', 'paypay', 'credit', 'transit_ic', 'other'],
      product_category: ['bento', 'rice', 'vegetable', 'bread', 'sweets', 'processed', 'laundry'],
    },
  },
} as const;
