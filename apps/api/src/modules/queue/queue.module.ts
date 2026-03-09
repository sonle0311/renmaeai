import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { PipelineProcessor } from "./pipeline.processor";
import { RealtimeModule } from "../realtime/realtime.module";
import { AiModule } from "../ai/ai.module";
import { ScriptEngineService } from "../pipeline/script-engine.service";
import { SceneSplitterService } from "../pipeline/scene-splitter.service";
import { VeoPromptService } from "../pipeline/veo-prompt.service";
import { PromptSafetyService } from "../pipeline/prompt-safety.service";
import { YoutubeExtractService } from "../pipeline/youtube-extract.service";
import { TtsService } from "../pipeline/tts.service";
// NEW services (13-step pipeline overhaul)
import { ConceptAnalysisService } from "../pipeline/concept-analysis.service";
import { VideoDirectionService } from "../pipeline/video-direction.service";
import { EntityExtractionService } from "../pipeline/entity-extraction.service";
import { ReferencePromptService } from "../pipeline/reference-prompt.service";
import { SceneBuilderPromptService } from "../pipeline/scene-builder-prompt.service";
import { VideoSegmentService } from "../pipeline/video-segment.service";

@Module({
    imports: [
        BullModule.registerQueue({ name: "pipeline" }),
        RealtimeModule,
        AiModule,
    ],
    providers: [
        PipelineProcessor,
        // Existing services
        ScriptEngineService,
        SceneSplitterService,
        VeoPromptService,
        PromptSafetyService,
        YoutubeExtractService,
        TtsService,
        // NEW services
        ConceptAnalysisService,
        VideoDirectionService,
        EntityExtractionService,
        ReferencePromptService,
        SceneBuilderPromptService,
        VideoSegmentService,
    ],
    exports: [PipelineProcessor],
})
export class QueueModule { }
