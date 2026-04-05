"""Professional report export endpoints."""

from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..routes.ai_summary import generate_summary
from ..services.database import JobService, PatientService, ResultService

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


def _fmt(value, digits: int = 1, suffix: str = "") -> str:
    if value is None:
        return "N/A"
    try:
        return f"{float(value):.{digits}f}{suffix}"
    except (TypeError, ValueError):
        return str(value)


def _variance(values) -> float | None:
    if not values or len(values) < 2:
        return None
    mean = sum(values) / len(values)
    return sum((x - mean) ** 2 for x in values) / len(values)


@router.get("/{job_id}/pdf")
async def export_report_pdf(job_id: str):
    """Generate a professional PDF report for a completed analysis job."""
    try:
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
            from reportlab.lib.units import mm
            from reportlab.platypus import (
                SimpleDocTemplate,
                Paragraph,
                Spacer,
                Table,
                TableStyle,
            )
        except ImportError as exc:
            raise HTTPException(
                status_code=500,
                detail="PDF export dependency is missing. Install reportlab to enable report export.",
            ) from exc

        job_svc = JobService()
        result_svc = ResultService()
        patient_svc = PatientService()

        job = job_svc.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if job.get("status") != "completed":
            raise HTTPException(status_code=400, detail="Report is only available for completed jobs")

        result = result_svc.get_by_job(job_id)
        if not result:
            raise HTTPException(status_code=404, detail="No analysis result found for this job")

        patient = None
        patient_ref = job.get("patient_ref")
        if patient_ref:
            patient = patient_svc.get(patient_ref)

        summary = await generate_summary(job_id)

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
            title=f"Pedi-Growth Report {job_id}",
            author="Pedi-Growth",
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name="ReportTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=8,
        ))
        styles.add(ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=10,
            spaceAfter=6,
        ))
        styles.add(ParagraphStyle(
            name="BodyReport",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#1f2937"),
        ))
        styles.add(ParagraphStyle(
            name="SmallMuted",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#6b7280"),
        ))

        result_lists = {
            "trunk_sway_array": result.get("trunk_sway_array") or [],
            "shoulder_tilt_array": result.get("shoulder_tilt_array") or [],
        }
        trunk_var = _variance(result_lists["trunk_sway_array"])
        shoulder_var = _variance(result_lists["shoulder_tilt_array"])

        story = []
        story.append(Paragraph("Pedi-Growth Clinical Gait Report", styles["ReportTitle"]))
        story.append(Paragraph("Professional analysis summary for clinical review and archival use.", styles["SmallMuted"]))
        story.append(Spacer(1, 6))

        meta_rows = [
            ["Patient", patient.get("patient_name") if patient else "N/A", "Patient ID", patient.get("patient_id") if patient else "N/A"],
            ["Age", str(patient.get("age")) if patient and patient.get("age") is not None else "N/A", "Analysis Date", job.get("created_at", "N/A")[:10] if isinstance(job.get("created_at"), str) else str(job.get("created_at", "N/A"))],
            ["Job ID", job_id, "Video", job.get("video_filename", "N/A")],
        ]
        meta_table = Table(meta_rows, colWidths=[28 * mm, 55 * mm, 28 * mm, 55 * mm])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eff6ff")),
            ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#e2e8f0")),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("LEADING", (0, 0), (-1, -1), 10),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("Clinical Summary", styles["SectionHeading"]))
        story.append(Paragraph(summary.overview, styles["BodyReport"]))
        story.append(Spacer(1, 6))
        story.append(Paragraph("What This Means", styles["SectionHeading"]))
        story.append(Paragraph(summary.what_this_means, styles["BodyReport"]))

        story.append(Paragraph("Conclusions and Confidence", styles["SectionHeading"]))
        confidence = getattr(summary.conclusiveness, "confidence_percentage", 75)
        confidence_reasoning = getattr(summary.conclusiveness, "confidence_reasoning", "Confidence assessment unavailable.")
        confidence_table = Table([
            ["Confidence", f"{confidence:.0f}%"],
            ["Reasoning", confidence_reasoning],
        ], colWidths=[35 * mm, 111 * mm])
        confidence_table.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#e2e8f0")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("LEADING", (0, 0), (-1, -1), 10),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(confidence_table)

        story.append(Paragraph("Key Findings", styles["SectionHeading"]))
        for finding in summary.key_findings:
            story.append(Paragraph(f"• {finding}", styles["BodyReport"]))

        story.append(Paragraph("Technical Metrics", styles["SectionHeading"]))
        metric_rows = [
            ["Left Knee Max Flexion", _fmt(result.get("left_max_flexion"), 1, "°"), "Right Knee Max Flexion", _fmt(result.get("right_max_flexion"), 1, "°")],
            ["Left Knee ROM", _fmt(result.get("left_rom"), 1, "°"), "Right Knee ROM", _fmt(result.get("right_rom"), 1, "°")],
            ["Symmetry Index", _fmt(result.get("symmetry_index"), 3), "Asymmetry", _fmt(result.get("asymmetry_percentage"), 1, "%")],
            ["Detection Rate", _fmt(result.get("detection_rate"), 1, "%"), "Frames", f"{result.get('frames_detected', 'N/A')} / {result.get('frames_processed', 'N/A')}"],
            ["Knee Valgus", _fmt(result.get("knee_valgus_angle"), 1, "°"), "Pelvic Tilt", _fmt(result.get("pelvic_tilt"), 1, "°")],
            ["Foot Progression", _fmt(result.get("foot_progression_angle"), 1, "°"), "Ankle Dorsiflexion", _fmt(result.get("ankle_dorsiflexion"), 1, "°")],
            ["Trunk Sway Variance", _fmt(trunk_var, 2), "Shoulder Tilt Variance", _fmt(shoulder_var, 2)],
        ]
        metric_table = Table(metric_rows, colWidths=[40 * mm, 28 * mm, 40 * mm, 28 * mm])
        metric_table.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#e2e8f0")),
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
            ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#f8fafc")),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("LEADING", (0, 0), (-1, -1), 10),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(metric_table)

        story.append(Paragraph("Risk Assessment", styles["SectionHeading"]))
        story.append(Paragraph(summary.risk_assessment, styles["BodyReport"]))

        story.append(Paragraph("Recommendations", styles["SectionHeading"]))
        for recommendation in summary.recommendations:
            story.append(Paragraph(f"• {recommendation}", styles["BodyReport"]))

        story.append(Paragraph("Clinical Disclaimer", styles["SectionHeading"]))
        story.append(Paragraph(summary.disclaimer, styles["SmallMuted"]))

        def _footer(canvas, doc):
            canvas.saveState()
            canvas.setFont("Helvetica", 8)
            canvas.setFillColor(colors.HexColor("#6b7280"))
            canvas.drawString(doc.leftMargin, 12 * mm, "Pedi-Growth Clinical Report")
            canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 12 * mm, f"Page {doc.page}")
            canvas.restoreState()

        doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
        buffer.seek(0)

        filename = f"pedi-growth-report-{job_id}.pdf"
        headers = {"Content-Disposition": f'inline; filename="{filename}"'}
        return StreamingResponse(buffer, media_type="application/pdf", headers=headers)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {type(exc).__name__}: {exc}")