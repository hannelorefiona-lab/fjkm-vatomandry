export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      adherents: {
        Row: {
          adresse: string | null
          created_at: string | null
          date_inscription: string
          date_naissance: string | null
          decede: boolean | null
          email: string | null
          etat_civil: Database["public"]["Enums"]["etat_civil"] | null
          faritra: Database["public"]["Enums"]["faritra"] | null
          fonction_eglise: string | null
          id_adherent: string
          mpandray: boolean | null
          nom: string
          prenom: string
          quartier: string | null
          sampana_id: string | null
          sexe: Database["public"]["Enums"]["sexe"]
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string | null
          date_inscription?: string
          date_naissance?: string | null
          decede?: boolean | null
          email?: string | null
          etat_civil?: Database["public"]["Enums"]["etat_civil"] | null
          faritra?: Database["public"]["Enums"]["faritra"] | null
          fonction_eglise?: string | null
          id_adherent?: string
          mpandray?: boolean | null
          nom: string
          prenom: string
          quartier?: string | null
          sampana_id?: string | null
          sexe: Database["public"]["Enums"]["sexe"]
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string | null
          date_inscription?: string
          date_naissance?: string | null
          decede?: boolean | null
          email?: string | null
          etat_civil?: Database["public"]["Enums"]["etat_civil"] | null
          faritra?: Database["public"]["Enums"]["faritra"] | null
          fonction_eglise?: string | null
          id_adherent?: string
          mpandray?: boolean | null
          nom?: string
          prenom?: string
          quartier?: string | null
          sampana_id?: string | null
          sexe?: Database["public"]["Enums"]["sexe"]
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adherents_sampana_id_fkey"
            columns: ["sampana_id"]
            isOneToOne: false
            referencedRelation: "sampana"
            referencedColumns: ["id_sampana"]
          },
        ]
      }
      adherents_groupes: {
        Row: {
          created_at: string | null
          date_adhesion: string
          id_adherent: string
          id_groupe: string
        }
        Insert: {
          created_at?: string | null
          date_adhesion?: string
          id_adherent: string
          id_groupe: string
        }
        Update: {
          created_at?: string | null
          date_adhesion?: string
          id_adherent?: string
          id_groupe?: string
        }
        Relationships: [
          {
            foreignKeyName: "adherents_groupes_id_adherent_fkey"
            columns: ["id_adherent"]
            isOneToOne: false
            referencedRelation: "adherents"
            referencedColumns: ["id_adherent"]
          },
          {
            foreignKeyName: "adherents_groupes_id_groupe_fkey"
            columns: ["id_groupe"]
            isOneToOne: false
            referencedRelation: "groupes"
            referencedColumns: ["id_groupe"]
          },
        ]
      }
      adidy: {
        Row: {
          adherent_id: string
          annee: number
          created_at: string | null
          date_paiement: string | null
          id: string
          mois: number
          montant: number
          paye: boolean | null
          updated_at: string | null
        }
        Insert: {
          adherent_id: string
          annee: number
          created_at?: string | null
          date_paiement?: string | null
          id?: string
          mois: number
          montant?: number
          paye?: boolean | null
          updated_at?: string | null
        }
        Update: {
          adherent_id?: string
          annee?: number
          created_at?: string | null
          date_paiement?: string | null
          id?: string
          mois?: number
          montant?: number
          paye?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adidy_adherent_id_fkey"
            columns: ["adherent_id"]
            isOneToOne: false
            referencedRelation: "adherents"
            referencedColumns: ["id_adherent"]
          },
        ]
      }
      contributions: {
        Row: {
          adherent_id: string
          created_at: string
          date_contribution: string
          id: string
          montant: number
          type: string
          updated_at: string
        }
        Insert: {
          adherent_id: string
          created_at?: string
          date_contribution?: string
          id?: string
          montant: number
          type: string
          updated_at?: string
        }
        Update: {
          adherent_id?: string
          created_at?: string
          date_contribution?: string
          id?: string
          montant?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contributions_adherent"
            columns: ["adherent_id"]
            isOneToOne: false
            referencedRelation: "adherents"
            referencedColumns: ["id_adherent"]
          },
        ]
      }
      groupes: {
        Row: {
          created_at: string | null
          description: string | null
          id_groupe: string
          nom_groupe: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id_groupe?: string
          nom_groupe: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id_groupe?: string
          nom_groupe?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          id_adherent: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_adherent?: string | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          id_adherent?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_adherent_fkey"
            columns: ["id_adherent"]
            isOneToOne: false
            referencedRelation: "adherents"
            referencedColumns: ["id_adherent"]
          },
        ]
      }
      sampana: {
        Row: {
          created_at: string | null
          description: string | null
          id_sampana: string
          nom_sampana: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id_sampana?: string
          nom_sampana: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id_sampana?: string
          nom_sampana?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_admin_or_responsable: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "ADMIN"
        | "RESPONSABLE"
        | "UTILISATEUR"
        | "SECRETAIRE"
        | "TRESORIER"
        | "MEMBRE"
      etat_civil: "celibataire" | "marie" | "veuf"
      faritra: "voalohany" | "faharoa" | "fahatelo" | "fahefatra" | "fahadimy"
      sexe: "M" | "F"
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
    Enums: {
      app_role: [
        "ADMIN",
        "RESPONSABLE",
        "UTILISATEUR",
        "SECRETAIRE",
        "TRESORIER",
        "MEMBRE",
      ],
      etat_civil: ["celibataire", "marie", "veuf"],
      faritra: ["voalohany", "faharoa", "fahatelo", "fahefatra", "fahadimy"],
      sexe: ["M", "F"],
    },
  },
} as const
