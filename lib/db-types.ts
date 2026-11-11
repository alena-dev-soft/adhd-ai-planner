
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "day_tasks": {
                  Row: {
                    "completed_pomodoros": number,"day_id": string,"feasibility": string | null,"feasibility_note": string | null,"id": string,"is_done": boolean,"slot": number,"target_is_manual": boolean,"target_pomodoros": number | null,"title": string | null,"week_task_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_pomodoros"?: number,"day_id": string,"feasibility"?: string | null,"feasibility_note"?: string | null,"id"?: string,"is_done"?: boolean,"slot": number,"target_is_manual"?: boolean,"target_pomodoros"?: number | null,"title"?: string | null,"week_task_id"?: string | null
                  }
                  Update: {
                    "completed_pomodoros"?: number,"day_id"?: string,"feasibility"?: string | null,"feasibility_note"?: string | null,"id"?: string,"is_done"?: boolean,"slot"?: number,"target_is_manual"?: boolean,"target_pomodoros"?: number | null,"title"?: string | null,"week_task_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "day_tasks_day_id_fkey"
      columns: ["day_id"]
isOneToOne: false
      referencedRelation: "days"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "day_tasks_week_task_id_fkey"
      columns: ["week_task_id"]
isOneToOne: false
      referencedRelation: "week_tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"days": {
                  Row: {
                    "closed_at": string | null,"date": string,"highlight": string | null,"id": string,"notes": string | null,"quote_id": number | null,"rating": number | null,"user_id": string,"what_didnt": string | null,"what_worked": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "closed_at"?: string | null,"date": string,"highlight"?: string | null,"id"?: string,"notes"?: string | null,"quote_id"?: number | null,"rating"?: number | null,"user_id": string,"what_didnt"?: string | null,"what_worked"?: string | null
                  }
                  Update: {
                    "closed_at"?: string | null,"date"?: string,"highlight"?: string | null,"id"?: string,"notes"?: string | null,"quote_id"?: number | null,"rating"?: number | null,"user_id"?: string,"what_didnt"?: string | null,"what_worked"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "days_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "display_name": string | null,"id": string,"rollover_hour": number,"time_zone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "display_name"?: string | null,"id": string,"rollover_hour"?: number,"time_zone"?: string
                  }
                  Update: {
                    "display_name"?: string | null,"id"?: string,"rollover_hour"?: number,"time_zone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"quotes": {
                  Row: {
                    "author": string | null,"id": number,"text": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author"?: string | null,"id"?: number,"text": string
                  }
                  Update: {
                    "author"?: string | null,"id"?: number,"text"?: string
                  }
                  Relationships: [
                    
                  ]
                },"week_tasks": {
                  Row: {
                    "id": string,"is_done": boolean,"slot": number,"title": string | null,"week_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"is_done"?: boolean,"slot": number,"title"?: string | null,"week_id": string
                  }
                  Update: {
                    "id"?: string,"is_done"?: boolean,"slot"?: number,"title"?: string | null,"week_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "week_tasks_week_id_fkey"
      columns: ["week_id"]
isOneToOne: false
      referencedRelation: "weeks"
      referencedColumns: ["id"]
    }
                  ]
                },"weeks": {
                  Row: {
                    "id": string,"user_id": string,"week_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"user_id": string,"week_start": string
                  }
                  Update: {
                    "id"?: string,"user_id"?: string,"week_start"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
